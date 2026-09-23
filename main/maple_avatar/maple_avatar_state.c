/**
 * [INPUT]: Depends on maple_avatar_state.h's public value types.
 * [OUTPUT]: Implements deterministic action/builder-page navigation, pause, and frame timing.
 * [POS]: Pure implementation of the firmware animation domain state.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "maple_avatar_state.h"

void maple_avatar_state_init(maple_avatar_state_t *state)
{
    if (!state) return;
    state->action = MAPLE_AVATAR_ACTION_STAND;
    state->frame = 0;
    state->elapsed_ms = 0;
    state->paused = false;
    state->builder_page = false;
}

static void reset_frame(maple_avatar_state_t *state)
{
    state->frame = 0;
    state->elapsed_ms = 0;
}

void maple_avatar_state_next_action(maple_avatar_state_t *state)
{
    if (!state) return;
    if (state->builder_page) {
        state->builder_page = false;
        state->action = MAPLE_AVATAR_ACTION_STAND;
    } else if (state->action == MAPLE_AVATAR_ACTION_TWO_HAND_WALK) {
        state->builder_page = true;
    } else {
        state->action = (maple_avatar_action_t)(state->action + 1);
    }
    reset_frame(state);
}

void maple_avatar_state_previous_action(maple_avatar_state_t *state)
{
    if (!state) return;
    if (state->builder_page) {
        state->builder_page = false;
        state->action = MAPLE_AVATAR_ACTION_TWO_HAND_WALK;
    } else if (state->action == MAPLE_AVATAR_ACTION_STAND) {
        state->builder_page = true;
    } else {
        state->action = (maple_avatar_action_t)(state->action - 1);
    }
    reset_frame(state);
}

void maple_avatar_state_toggle_pause(maple_avatar_state_t *state)
{
    if (state && !state->builder_page) state->paused = !state->paused;
}

bool maple_avatar_state_is_builder_page(const maple_avatar_state_t *state)
{
    return state && state->builder_page;
}

bool maple_avatar_state_is_animating(const maple_avatar_state_t *state,
                                     uint16_t frame_count)
{
    return state && !state->builder_page && !state->paused && frame_count > 1;
}

bool maple_avatar_state_advance(maple_avatar_state_t *state,
                                uint32_t delta_ms,
                                uint16_t frame_count,
                                uint16_t frame_delay_ms)
{
    if (!state) return false;
    if (state->builder_page) {
        reset_frame(state);
        return false;
    }
    if (frame_count <= 1 || frame_delay_ms == 0) {
        reset_frame(state);
        return false;
    }
    if (state->paused) return false;

    uint64_t total_ms = (uint64_t)state->elapsed_ms + delta_ms;
    uint64_t steps = total_ms / frame_delay_ms;
    state->elapsed_ms = (uint32_t)(total_ms % frame_delay_ms);
    if (steps == 0) return false;

    state->frame = (uint16_t)((state->frame + steps) % frame_count);
    return true;
}
