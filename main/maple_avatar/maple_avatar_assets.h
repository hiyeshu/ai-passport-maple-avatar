/**
 * [INPUT]: Depends on LVGL image types and the versioned avatar pack stored in Flash.
 * [OUTPUT]: Exposes loaded profile/builder screens, action frames, timing, and build identity.
 * [POS]: Stable runtime interface hiding partition mapping and binary-pack validation.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include <stdbool.h>
#include <stdint.h>

#include "lvgl.h"
#include "maple_avatar_state.h"

#define MAPLE_AVATAR_SCREEN_WIDTH 240
#define MAPLE_AVATAR_SCREEN_HEIGHT 320
#define MAPLE_AVATAR_FRAME_WIDTH 240
#define MAPLE_AVATAR_FRAME_HEIGHT 246
#define MAPLE_AVATAR_FRAME_X 0
#define MAPLE_AVATAR_FRAME_Y 0

typedef struct {
    const char *id;
    uint16_t frame_count;
    uint16_t frame_delay_ms;
    const lv_image_dsc_t *const *frames;
} maple_avatar_action_assets_t;

bool maple_avatar_assets_load(void);
void maple_avatar_assets_unload(void);
bool maple_avatar_assets_is_loaded(void);
uint32_t maple_avatar_assets_build_id(void);
const lv_image_dsc_t *maple_avatar_assets_screen(void);
const lv_image_dsc_t *maple_avatar_assets_builder_screen(void);
const maple_avatar_action_assets_t *maple_avatar_assets_action(
    maple_avatar_action_t action);
