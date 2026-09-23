/**
 * [INPUT]: Depends on the avatar Flash partition, pure pack parser, ESP mmap, and LVGL descriptors.
 * [OUTPUT]: Loads one validated pack and exposes immutable runtime image/action views.
 * [POS]: Storage Adapter behind maple_avatar_assets.h; the UI never sees partition offsets.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "maple_avatar_assets.h"

#include <stdbool.h>
#include <stddef.h>
#include <string.h>

#include "esp_log.h"
#include "esp_partition.h"
#include "maple_avatar_pack_format.h"

#define AVATAR_PARTITION_SUBTYPE ((esp_partition_subtype_t)0x40)

static const char *TAG = "avatar_assets";

static const char *const ACTION_IDS[MAPLE_AVATAR_ACTION_COUNT] = {
    "stand",
    "walk",
    "attack",
    "sit",
    "two_hand_stand",
    "two_hand_walk",
};

static esp_partition_mmap_handle_t s_mmap_handle;
static bool s_mapped;
static maple_avatar_pack_view_t s_pack;
static lv_image_dsc_t s_screen;
static lv_image_dsc_t s_builder_screen;
static lv_image_dsc_t
    s_frame_descriptors[MAPLE_AVATAR_ACTION_COUNT][MAPLE_AVATAR_PACK_MAX_FRAMES];
static const lv_image_dsc_t
    *s_frame_pointers[MAPLE_AVATAR_ACTION_COUNT][MAPLE_AVATAR_PACK_MAX_FRAMES];
static maple_avatar_action_assets_t s_actions[MAPLE_AVATAR_ACTION_COUNT];

static void init_descriptor(lv_image_dsc_t *descriptor,
                            lv_color_format_t color_format,
                            uint32_t width,
                            uint32_t height,
                            uint32_t bytes_per_pixel,
                            const uint8_t *data)
{
    memset(descriptor, 0, sizeof(*descriptor));
    descriptor->header.magic = LV_IMAGE_HEADER_MAGIC;
    descriptor->header.cf = color_format;
    descriptor->header.w = width;
    descriptor->header.h = height;
    descriptor->header.stride = width * 2u;
    descriptor->data_size = width * height * bytes_per_pixel;
    descriptor->data = data;
}

static void reset_assets(void)
{
    memset(&s_pack, 0, sizeof(s_pack));
    memset(&s_screen, 0, sizeof(s_screen));
    memset(&s_builder_screen, 0, sizeof(s_builder_screen));
    memset(s_frame_descriptors, 0, sizeof(s_frame_descriptors));
    memset(s_frame_pointers, 0, sizeof(s_frame_pointers));
    memset(s_actions, 0, sizeof(s_actions));
}

bool maple_avatar_assets_load(void)
{
    if (s_mapped) return true;
    reset_assets();

    const esp_partition_t *partition = esp_partition_find_first(
        ESP_PARTITION_TYPE_DATA, AVATAR_PARTITION_SUBTYPE, "avatar");
    if (!partition) {
        ESP_LOGE(TAG, "avatar partition is missing");
        return false;
    }

    uint8_t header[MAPLE_AVATAR_PACK_HEADER_BYTES];
    esp_err_t read_error = esp_partition_read(partition, 0, header, sizeof(header));
    if (read_error != ESP_OK) {
        ESP_LOGE(TAG, "avatar header read failed: %s", esp_err_to_name(read_error));
        return false;
    }

    uint32_t total_size = 0;
    maple_avatar_pack_status_t status = maple_avatar_pack_peek_total_size(
        header, sizeof(header), &total_size);
    if (status != MAPLE_AVATAR_PACK_OK || total_size > partition->size) {
        ESP_LOGE(TAG, "avatar header is invalid: %s, size=%lu/%lu",
                 maple_avatar_pack_status_name(status),
                 (unsigned long)total_size,
                 (unsigned long)partition->size);
        return false;
    }

    const void *mapped = NULL;
    esp_err_t mmap_error = esp_partition_mmap(
        partition,
        0,
        total_size,
        ESP_PARTITION_MMAP_DATA,
        &mapped,
        &s_mmap_handle);
    if (mmap_error != ESP_OK) {
        ESP_LOGE(TAG, "avatar mmap failed: %s", esp_err_to_name(mmap_error));
        return false;
    }
    s_mapped = true;

    status = maple_avatar_pack_parse(mapped, total_size, &s_pack);
    if (status != MAPLE_AVATAR_PACK_OK) {
        ESP_LOGE(TAG, "avatar pack rejected: %s", maple_avatar_pack_status_name(status));
        maple_avatar_assets_unload();
        return false;
    }

    init_descriptor(
        &s_screen,
        LV_COLOR_FORMAT_RGB565,
        MAPLE_AVATAR_SCREEN_WIDTH,
        MAPLE_AVATAR_SCREEN_HEIGHT,
        2,
        s_pack.screen);
    init_descriptor(
        &s_builder_screen,
        LV_COLOR_FORMAT_RGB565,
        MAPLE_AVATAR_SCREEN_WIDTH,
        MAPLE_AVATAR_SCREEN_HEIGHT,
        2,
        s_pack.builder_screen);

    for (unsigned action = 0; action < MAPLE_AVATAR_ACTION_COUNT; action++) {
        const maple_avatar_pack_action_view_t *pack_action = &s_pack.actions[action];
        for (unsigned frame = 0; frame < pack_action->frame_count; frame++) {
            init_descriptor(
                &s_frame_descriptors[action][frame],
                LV_COLOR_FORMAT_RGB565A8,
                MAPLE_AVATAR_FRAME_WIDTH,
                MAPLE_AVATAR_FRAME_HEIGHT,
                3,
                pack_action->frames[frame]);
            s_frame_pointers[action][frame] = &s_frame_descriptors[action][frame];
        }
        s_actions[action].id = ACTION_IDS[action];
        s_actions[action].frame_count = pack_action->frame_count;
        s_actions[action].frame_delay_ms = pack_action->frame_delay_ms;
        s_actions[action].frames = s_frame_pointers[action];
    }

    ESP_LOGI(TAG, "loaded build %lu (%lu bytes, sample=%d)",
             (unsigned long)s_pack.build_id,
             (unsigned long)s_pack.total_size,
             !!(s_pack.flags & MAPLE_AVATAR_PACK_FLAG_SAMPLE));
    return true;
}

void maple_avatar_assets_unload(void)
{
    if (s_mapped) {
        esp_partition_munmap(s_mmap_handle);
        s_mapped = false;
    }
    reset_assets();
}

bool maple_avatar_assets_is_loaded(void)
{
    return s_mapped;
}

uint32_t maple_avatar_assets_build_id(void)
{
    return s_mapped ? s_pack.build_id : 0;
}

const lv_image_dsc_t *maple_avatar_assets_screen(void)
{
    return s_mapped ? &s_screen : NULL;
}

const lv_image_dsc_t *maple_avatar_assets_builder_screen(void)
{
    return s_mapped ? &s_builder_screen : NULL;
}

const maple_avatar_action_assets_t *maple_avatar_assets_action(
    maple_avatar_action_t action)
{
    if (!s_mapped || action < 0 || action >= MAPLE_AVATAR_ACTION_COUNT) return NULL;
    return &s_actions[action];
}
