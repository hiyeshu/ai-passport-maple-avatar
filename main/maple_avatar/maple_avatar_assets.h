/**
 * [INPUT]: Depends on LVGL image descriptor types and the six-action domain enumeration.
 * [OUTPUT]: Exposes generated screen, full-width origin-aligned frames, timing, and imported profile metadata.
 * [POS]: Stable contract between generated assets and the handwritten application layer.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

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
    const char *label;
    uint16_t frame_count;
    uint16_t frame_delay_ms;
    const lv_image_dsc_t *const *frames;
} maple_avatar_action_assets_t;

typedef struct {
    uint32_t build_id;
    const char *server;
    uint16_t level;
    const char *job;
    const char *name;
    const char *family;
} maple_avatar_profile_t;

extern const lv_image_dsc_t g_maple_avatar_screen;
extern const maple_avatar_action_assets_t
    g_maple_avatar_actions[MAPLE_AVATAR_ACTION_COUNT];
extern const maple_avatar_profile_t g_maple_avatar_profile;
