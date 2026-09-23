/**
 * [INPUT]: Depends on schema constants from maple_avatar_pack_format.h and untrusted pack bytes.
 * [OUTPUT]: Implements bounds-checked little-endian parsing and payload CRC32 verification.
 * [POS]: Pure parser implementation; contains no LVGL, ESP-IDF, allocation, or storage access.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "maple_avatar_pack_format.h"

#include <stdbool.h>
#include <string.h>

#define ACTION_TABLE_OFFSET 64u
#define ACTION_ENTRY_BYTES 20u

static const uint8_t PACK_MAGIC[8] = {
    0x4d, 0x49, 0x49, 0x49, 0x41, 0x4f, 0x31, 0x00,
};

static uint16_t read_u16(const uint8_t *bytes, size_t offset)
{
    return (uint16_t)bytes[offset] |
           (uint16_t)((uint16_t)bytes[offset + 1] << 8);
}

static uint32_t read_u32(const uint8_t *bytes, size_t offset)
{
    return (uint32_t)bytes[offset] |
           ((uint32_t)bytes[offset + 1] << 8) |
           ((uint32_t)bytes[offset + 2] << 16) |
           ((uint32_t)bytes[offset + 3] << 24);
}

static uint32_t crc32(const uint8_t *bytes, size_t size)
{
    uint32_t crc = UINT32_MAX;
    for (size_t index = 0; index < size; index++) {
        crc ^= bytes[index];
        for (unsigned bit = 0; bit < 8; bit++) {
            const uint32_t mask = (uint32_t)-(int32_t)(crc & 1u);
            crc = (crc >> 1) ^ (0xedb88320u & mask);
        }
    }
    return crc ^ UINT32_MAX;
}

static bool asset_is_valid(uint32_t offset, uint32_t size, uint32_t total_size)
{
    return offset >= MAPLE_AVATAR_PACK_HEADER_BYTES &&
           (offset & 3u) == 0 &&
           size <= total_size &&
           offset <= total_size - size;
}

maple_avatar_pack_status_t maple_avatar_pack_peek_total_size(
    const uint8_t *header,
    size_t header_size,
    uint32_t *total_size)
{
    if (!header || !total_size) return MAPLE_AVATAR_PACK_ERROR_ARGUMENT;
    if (header_size < MAPLE_AVATAR_PACK_HEADER_BYTES) {
        return MAPLE_AVATAR_PACK_ERROR_LENGTH;
    }
    if (memcmp(header, PACK_MAGIC, sizeof(PACK_MAGIC)) != 0) {
        return MAPLE_AVATAR_PACK_ERROR_MAGIC;
    }
    if (read_u16(header, 8) != MAPLE_AVATAR_PACK_VERSION ||
        read_u16(header, 10) != MAPLE_AVATAR_PACK_HEADER_BYTES) {
        return MAPLE_AVATAR_PACK_ERROR_SCHEMA;
    }
    const uint32_t declared_size = read_u32(header, 12);
    if (declared_size < MAPLE_AVATAR_PACK_HEADER_BYTES) {
        return MAPLE_AVATAR_PACK_ERROR_LENGTH;
    }
    *total_size = declared_size;
    return MAPLE_AVATAR_PACK_OK;
}

maple_avatar_pack_status_t maple_avatar_pack_parse(
    const uint8_t *bytes,
    size_t available_size,
    maple_avatar_pack_view_t *view)
{
    if (!bytes || !view) return MAPLE_AVATAR_PACK_ERROR_ARGUMENT;
    memset(view, 0, sizeof(*view));
    uint32_t total_size = 0;
    maple_avatar_pack_status_t peek_status = maple_avatar_pack_peek_total_size(
        bytes, available_size, &total_size);
    if (peek_status != MAPLE_AVATAR_PACK_OK) return peek_status;
    if (total_size > available_size) {
        return MAPLE_AVATAR_PACK_ERROR_LENGTH;
    }
    const uint32_t expected_checksum = read_u32(bytes, 16);
    const uint32_t actual_checksum = crc32(
        bytes + MAPLE_AVATAR_PACK_HEADER_BYTES,
        total_size - MAPLE_AVATAR_PACK_HEADER_BYTES);
    if (expected_checksum != actual_checksum) {
        return MAPLE_AVATAR_PACK_ERROR_CHECKSUM;
    }

    if (read_u32(bytes, 36) != MAPLE_AVATAR_PACK_SCREEN_BYTES ||
        read_u32(bytes, 40) != MAPLE_AVATAR_PACK_FRAME_BYTES ||
        read_u16(bytes, 44) != MAPLE_AVATAR_PACK_ACTION_COUNT ||
        read_u16(bytes, 46) != MAPLE_AVATAR_PACK_MAX_FRAMES ||
        read_u16(bytes, 48) != MAPLE_AVATAR_PACK_SCREEN_WIDTH ||
        read_u16(bytes, 50) != MAPLE_AVATAR_PACK_SCREEN_HEIGHT ||
        read_u16(bytes, 52) != MAPLE_AVATAR_PACK_FRAME_WIDTH ||
        read_u16(bytes, 54) != MAPLE_AVATAR_PACK_FRAME_HEIGHT) {
        return MAPLE_AVATAR_PACK_ERROR_GEOMETRY;
    }

    const uint32_t screen_offset = read_u32(bytes, 28);
    const uint32_t builder_screen_offset = read_u32(bytes, 32);
    if (!asset_is_valid(screen_offset, MAPLE_AVATAR_PACK_SCREEN_BYTES, total_size) ||
        !asset_is_valid(builder_screen_offset, MAPLE_AVATAR_PACK_SCREEN_BYTES, total_size)) {
        return MAPLE_AVATAR_PACK_ERROR_OFFSET;
    }

    for (unsigned action = 0; action < MAPLE_AVATAR_PACK_ACTION_COUNT; action++) {
        const size_t entry = ACTION_TABLE_OFFSET + action * ACTION_ENTRY_BYTES;
        const uint16_t frame_count = read_u16(bytes, entry);
        const uint16_t frame_delay_ms = read_u16(bytes, entry + 2);
        if (frame_count < 1 || frame_count > MAPLE_AVATAR_PACK_MAX_FRAMES ||
            (frame_count == 1 && frame_delay_ms != 0) ||
            (frame_count > 1 && frame_delay_ms == 0)) {
            return MAPLE_AVATAR_PACK_ERROR_ACTION;
        }
        view->actions[action].frame_count = frame_count;
        view->actions[action].frame_delay_ms = frame_delay_ms;
        for (unsigned frame = 0; frame < frame_count; frame++) {
            const uint32_t offset = read_u32(bytes, entry + 4 + frame * 4);
            if (!asset_is_valid(offset, MAPLE_AVATAR_PACK_FRAME_BYTES, total_size)) {
                return MAPLE_AVATAR_PACK_ERROR_OFFSET;
            }
            view->actions[action].frames[frame] = bytes + offset;
        }
    }

    view->total_size = total_size;
    view->checksum = actual_checksum;
    view->flags = read_u32(bytes, 20);
    view->build_id = read_u32(bytes, 24);
    view->screen = bytes + screen_offset;
    view->builder_screen = bytes + builder_screen_offset;
    return MAPLE_AVATAR_PACK_OK;
}

const char *maple_avatar_pack_status_name(maple_avatar_pack_status_t status)
{
    switch (status) {
        case MAPLE_AVATAR_PACK_OK: return "ok";
        case MAPLE_AVATAR_PACK_ERROR_ARGUMENT: return "argument";
        case MAPLE_AVATAR_PACK_ERROR_MAGIC: return "magic";
        case MAPLE_AVATAR_PACK_ERROR_SCHEMA: return "schema";
        case MAPLE_AVATAR_PACK_ERROR_LENGTH: return "length";
        case MAPLE_AVATAR_PACK_ERROR_CHECKSUM: return "checksum";
        case MAPLE_AVATAR_PACK_ERROR_GEOMETRY: return "geometry";
        case MAPLE_AVATAR_PACK_ERROR_ACTION: return "action";
        case MAPLE_AVATAR_PACK_ERROR_OFFSET: return "offset";
        default: return "unknown";
    }
}
