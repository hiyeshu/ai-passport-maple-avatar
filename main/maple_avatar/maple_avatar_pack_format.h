/**
 * [INPUT]: Depends only on byte buffers produced by avatar-pack schema version 1.
 * [OUTPUT]: Exposes validated screen/action views and explicit parse failure codes.
 * [POS]: Pure binary-format interface shared by host tests and the ESP partition Adapter.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include <stddef.h>
#include <stdint.h>

#define MAPLE_AVATAR_PACK_VERSION 1
#define MAPLE_AVATAR_PACK_HEADER_BYTES 256
#define MAPLE_AVATAR_PACK_FLAG_SAMPLE 1u
#define MAPLE_AVATAR_PACK_SCREEN_WIDTH 240
#define MAPLE_AVATAR_PACK_SCREEN_HEIGHT 320
#define MAPLE_AVATAR_PACK_FRAME_WIDTH 240
#define MAPLE_AVATAR_PACK_FRAME_HEIGHT 246
#define MAPLE_AVATAR_PACK_SCREEN_BYTES \
    (MAPLE_AVATAR_PACK_SCREEN_WIDTH * MAPLE_AVATAR_PACK_SCREEN_HEIGHT * 2u)
#define MAPLE_AVATAR_PACK_FRAME_BYTES \
    (MAPLE_AVATAR_PACK_FRAME_WIDTH * MAPLE_AVATAR_PACK_FRAME_HEIGHT * 3u)
#define MAPLE_AVATAR_PACK_MAX_FRAMES 4

typedef enum {
    MAPLE_AVATAR_PACK_ACTION_STAND = 0,
    MAPLE_AVATAR_PACK_ACTION_WALK,
    MAPLE_AVATAR_PACK_ACTION_ATTACK,
    MAPLE_AVATAR_PACK_ACTION_SIT,
    MAPLE_AVATAR_PACK_ACTION_TWO_HAND_STAND,
    MAPLE_AVATAR_PACK_ACTION_TWO_HAND_WALK,
    MAPLE_AVATAR_PACK_ACTION_COUNT,
} maple_avatar_pack_action_t;

typedef enum {
    MAPLE_AVATAR_PACK_OK = 0,
    MAPLE_AVATAR_PACK_ERROR_ARGUMENT,
    MAPLE_AVATAR_PACK_ERROR_MAGIC,
    MAPLE_AVATAR_PACK_ERROR_SCHEMA,
    MAPLE_AVATAR_PACK_ERROR_LENGTH,
    MAPLE_AVATAR_PACK_ERROR_CHECKSUM,
    MAPLE_AVATAR_PACK_ERROR_GEOMETRY,
    MAPLE_AVATAR_PACK_ERROR_ACTION,
    MAPLE_AVATAR_PACK_ERROR_OFFSET,
} maple_avatar_pack_status_t;

typedef struct {
    uint16_t frame_count;
    uint16_t frame_delay_ms;
    const uint8_t *frames[MAPLE_AVATAR_PACK_MAX_FRAMES];
} maple_avatar_pack_action_view_t;

typedef struct {
    uint32_t total_size;
    uint32_t checksum;
    uint32_t flags;
    uint32_t build_id;
    const uint8_t *screen;
    const uint8_t *builder_screen;
    maple_avatar_pack_action_view_t actions[MAPLE_AVATAR_PACK_ACTION_COUNT];
} maple_avatar_pack_view_t;

maple_avatar_pack_status_t maple_avatar_pack_parse(
    const uint8_t *bytes,
    size_t available_size,
    maple_avatar_pack_view_t *view);

maple_avatar_pack_status_t maple_avatar_pack_peek_total_size(
    const uint8_t *header,
    size_t header_size,
    uint32_t *total_size);

const char *maple_avatar_pack_status_name(maple_avatar_pack_status_t status);
