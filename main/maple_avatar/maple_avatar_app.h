/**
 * [INPUT]: Depends on LVGL task ownership and normalized application commands.
 * [OUTPUT]: Creates the full-screen avatar UI and applies action/pause commands.
 * [POS]: Firmware presentation boundary between main input dispatch and generated assets.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include "lvgl.h"

typedef enum {
    MAPLE_AVATAR_COMMAND_PREVIOUS_ACTION = 0,
    MAPLE_AVATAR_COMMAND_NEXT_ACTION,
    MAPLE_AVATAR_COMMAND_TOGGLE_PAUSE,
} maple_avatar_command_t;

lv_obj_t *maple_avatar_app_create(int battery_soc);
void maple_avatar_app_handle_command(maple_avatar_command_t command);
