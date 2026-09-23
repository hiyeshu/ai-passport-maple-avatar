/**
 * [INPUT]: Depends only on fixed-width integer and boolean C types.
 * [OUTPUT]: Exposes six-action playback plus a non-modal builder-page navigation state.
 * [POS]: Firmware domain core, independent from LVGL, FreeRTOS, BSP, and generated assets.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include <stdbool.h>
#include <stdint.h>

typedef enum {
    MAPLE_AVATAR_ACTION_STAND = 0,
    MAPLE_AVATAR_ACTION_WALK,
    MAPLE_AVATAR_ACTION_ATTACK,
    MAPLE_AVATAR_ACTION_SIT,
    MAPLE_AVATAR_ACTION_TWO_HAND_STAND,
    MAPLE_AVATAR_ACTION_TWO_HAND_WALK,
    MAPLE_AVATAR_ACTION_COUNT,
} maple_avatar_action_t;

typedef struct {
    maple_avatar_action_t action;
    uint16_t frame;
    uint32_t elapsed_ms;
    bool paused;
    bool builder_page;
} maple_avatar_state_t;

void maple_avatar_state_init(maple_avatar_state_t *state);
void maple_avatar_state_next_action(maple_avatar_state_t *state);
void maple_avatar_state_previous_action(maple_avatar_state_t *state);
void maple_avatar_state_toggle_pause(maple_avatar_state_t *state);
bool maple_avatar_state_is_builder_page(const maple_avatar_state_t *state);
bool maple_avatar_state_is_animating(const maple_avatar_state_t *state,
                                     uint16_t frame_count);
bool maple_avatar_state_advance(maple_avatar_state_t *state,
                                uint32_t delta_ms,
                                uint16_t frame_count,
                                uint16_t frame_delay_ms);
