/**
 * [INPUT]: Generated from the public MXDC build URL by tools/maple_avatar/import_avatar.mjs.
 * [OUTPUT]: Provides immutable LVGL image descriptors, action assets, and profile metadata.
 * [POS]: Generated firmware data adapter; do not edit by hand.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "maple_avatar_assets.h"

#include <stdint.h>

extern const uint8_t _binary_screen_rgb565_start[] asm("_binary_screen_rgb565_start");
extern const uint8_t _binary_stand_00_rgb565a8_start[] asm("_binary_stand_00_rgb565a8_start");
extern const uint8_t _binary_stand_01_rgb565a8_start[] asm("_binary_stand_01_rgb565a8_start");
extern const uint8_t _binary_stand_02_rgb565a8_start[] asm("_binary_stand_02_rgb565a8_start");
extern const uint8_t _binary_walk_00_rgb565a8_start[] asm("_binary_walk_00_rgb565a8_start");
extern const uint8_t _binary_walk_01_rgb565a8_start[] asm("_binary_walk_01_rgb565a8_start");
extern const uint8_t _binary_walk_02_rgb565a8_start[] asm("_binary_walk_02_rgb565a8_start");
extern const uint8_t _binary_walk_03_rgb565a8_start[] asm("_binary_walk_03_rgb565a8_start");
extern const uint8_t _binary_attack_00_rgb565a8_start[] asm("_binary_attack_00_rgb565a8_start");
extern const uint8_t _binary_attack_01_rgb565a8_start[] asm("_binary_attack_01_rgb565a8_start");
extern const uint8_t _binary_attack_02_rgb565a8_start[] asm("_binary_attack_02_rgb565a8_start");
extern const uint8_t _binary_sit_00_rgb565a8_start[] asm("_binary_sit_00_rgb565a8_start");
extern const uint8_t _binary_two_hand_stand_00_rgb565a8_start[] asm("_binary_two_hand_stand_00_rgb565a8_start");
extern const uint8_t _binary_two_hand_stand_01_rgb565a8_start[] asm("_binary_two_hand_stand_01_rgb565a8_start");
extern const uint8_t _binary_two_hand_stand_02_rgb565a8_start[] asm("_binary_two_hand_stand_02_rgb565a8_start");
extern const uint8_t _binary_two_hand_walk_00_rgb565a8_start[] asm("_binary_two_hand_walk_00_rgb565a8_start");
extern const uint8_t _binary_two_hand_walk_01_rgb565a8_start[] asm("_binary_two_hand_walk_01_rgb565a8_start");
extern const uint8_t _binary_two_hand_walk_02_rgb565a8_start[] asm("_binary_two_hand_walk_02_rgb565a8_start");
extern const uint8_t _binary_two_hand_walk_03_rgb565a8_start[] asm("_binary_two_hand_walk_03_rgb565a8_start");

const lv_image_dsc_t g_maple_avatar_screen = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_SCREEN_WIDTH,
    .header.h = MAPLE_AVATAR_SCREEN_HEIGHT,
    .header.stride = MAPLE_AVATAR_SCREEN_WIDTH * 2,
    .data_size = MAPLE_AVATAR_SCREEN_WIDTH * MAPLE_AVATAR_SCREEN_HEIGHT * 2,
    .data = _binary_screen_rgb565_start,
};

static const lv_image_dsc_t s_stand_frame_0 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_stand_00_rgb565a8_start,
};

static const lv_image_dsc_t s_stand_frame_1 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_stand_01_rgb565a8_start,
};

static const lv_image_dsc_t s_stand_frame_2 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_stand_02_rgb565a8_start,
};

static const lv_image_dsc_t s_walk_frame_0 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_walk_00_rgb565a8_start,
};

static const lv_image_dsc_t s_walk_frame_1 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_walk_01_rgb565a8_start,
};

static const lv_image_dsc_t s_walk_frame_2 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_walk_02_rgb565a8_start,
};

static const lv_image_dsc_t s_walk_frame_3 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_walk_03_rgb565a8_start,
};

static const lv_image_dsc_t s_attack_frame_0 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_attack_00_rgb565a8_start,
};

static const lv_image_dsc_t s_attack_frame_1 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_attack_01_rgb565a8_start,
};

static const lv_image_dsc_t s_attack_frame_2 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_attack_02_rgb565a8_start,
};

static const lv_image_dsc_t s_sit_frame_0 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_sit_00_rgb565a8_start,
};

static const lv_image_dsc_t s_two_hand_stand_frame_0 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_two_hand_stand_00_rgb565a8_start,
};

static const lv_image_dsc_t s_two_hand_stand_frame_1 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_two_hand_stand_01_rgb565a8_start,
};

static const lv_image_dsc_t s_two_hand_stand_frame_2 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_two_hand_stand_02_rgb565a8_start,
};

static const lv_image_dsc_t s_two_hand_walk_frame_0 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_two_hand_walk_00_rgb565a8_start,
};

static const lv_image_dsc_t s_two_hand_walk_frame_1 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_two_hand_walk_01_rgb565a8_start,
};

static const lv_image_dsc_t s_two_hand_walk_frame_2 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_two_hand_walk_02_rgb565a8_start,
};

static const lv_image_dsc_t s_two_hand_walk_frame_3 = {
    .header.magic = LV_IMAGE_HEADER_MAGIC,
    .header.cf = LV_COLOR_FORMAT_RGB565A8,
    .header.flags = 0,
    .header.w = MAPLE_AVATAR_FRAME_WIDTH,
    .header.h = MAPLE_AVATAR_FRAME_HEIGHT,
    .header.stride = MAPLE_AVATAR_FRAME_WIDTH * 2,
    .data_size = MAPLE_AVATAR_FRAME_WIDTH * MAPLE_AVATAR_FRAME_HEIGHT * 3,
    .data = _binary_two_hand_walk_03_rgb565a8_start,
};

static const lv_image_dsc_t *const s_stand_frames[] = { &s_stand_frame_0, &s_stand_frame_1, &s_stand_frame_2 };
static const lv_image_dsc_t *const s_walk_frames[] = { &s_walk_frame_0, &s_walk_frame_1, &s_walk_frame_2, &s_walk_frame_3 };
static const lv_image_dsc_t *const s_attack_frames[] = { &s_attack_frame_0, &s_attack_frame_1, &s_attack_frame_2 };
static const lv_image_dsc_t *const s_sit_frames[] = { &s_sit_frame_0 };
static const lv_image_dsc_t *const s_two_hand_stand_frames[] = { &s_two_hand_stand_frame_0, &s_two_hand_stand_frame_1, &s_two_hand_stand_frame_2 };
static const lv_image_dsc_t *const s_two_hand_walk_frames[] = { &s_two_hand_walk_frame_0, &s_two_hand_walk_frame_1, &s_two_hand_walk_frame_2, &s_two_hand_walk_frame_3 };

_Static_assert(MAPLE_AVATAR_ACTION_COUNT == 6,
               "generated action table must match maple_avatar_action_t");

const maple_avatar_action_assets_t g_maple_avatar_actions[MAPLE_AVATAR_ACTION_COUNT] = {
    {
        .id = "stand",
        .label = "站立",
        .frame_count = 3,
        .frame_delay_ms = 350,
        .frames = s_stand_frames,
    },
    {
        .id = "walk",
        .label = "行走",
        .frame_count = 4,
        .frame_delay_ms = 200,
        .frames = s_walk_frames,
    },
    {
        .id = "attack",
        .label = "攻击",
        .frame_count = 3,
        .frame_delay_ms = 200,
        .frames = s_attack_frames,
    },
    {
        .id = "sit",
        .label = "坐下",
        .frame_count = 1,
        .frame_delay_ms = 0,
        .frames = s_sit_frames,
    },
    {
        .id = "two_hand_stand",
        .label = "双手持武器站立",
        .frame_count = 3,
        .frame_delay_ms = 350,
        .frames = s_two_hand_stand_frames,
    },
    {
        .id = "two_hand_walk",
        .label = "双手持武器行走",
        .frame_count = 4,
        .frame_delay_ms = 200,
        .frames = s_two_hand_walk_frames,
    }
};

const maple_avatar_profile_t g_maple_avatar_profile = {
    .build_id = 5293,
    .server = "绿水灵",
    .level = 30,
    .job = "冰雷法师",
    .name = "蓝莓呀",
    .family = "MiiiAo",
};
