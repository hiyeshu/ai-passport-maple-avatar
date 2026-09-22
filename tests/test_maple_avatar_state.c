/**
 * [INPUT]: Depends on the public maple_avatar_state state-machine API.
 * [OUTPUT]: Verifies default playback state and device-button transitions without LVGL.
 * [POS]: Host behavioral test for the firmware animation controller.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include <assert.h>

#include "maple_avatar_state.h"

int main(void)
{
    maple_avatar_state_t state;
    maple_avatar_state_init(&state);

    assert(state.action == MAPLE_AVATAR_ACTION_STAND);
    assert(state.frame == 0);
    assert(state.elapsed_ms == 0);
    assert(!state.paused);

    state.frame = 2;
    state.elapsed_ms = 77;
    maple_avatar_state_next_action(&state);
    assert(state.action == MAPLE_AVATAR_ACTION_WALK);
    assert(state.frame == 0);
    assert(state.elapsed_ms == 0);

    maple_avatar_state_previous_action(&state);
    assert(state.action == MAPLE_AVATAR_ACTION_STAND);
    maple_avatar_state_previous_action(&state);
    assert(state.action == MAPLE_AVATAR_ACTION_TWO_HAND_WALK);

    maple_avatar_state_toggle_pause(&state);
    assert(state.paused);
    assert(!maple_avatar_state_is_animating(&state, 4));
    assert(!maple_avatar_state_advance(&state, 500, 4, 200));
    assert(state.frame == 0);

    maple_avatar_state_toggle_pause(&state);
    assert(maple_avatar_state_is_animating(&state, 4));
    assert(maple_avatar_state_advance(&state, 450, 4, 200));
    assert(state.frame == 2);
    assert(state.elapsed_ms == 50);
    assert(maple_avatar_state_advance(&state, 350, 4, 200));
    assert(state.frame == 0);
    assert(state.elapsed_ms == 0);

    assert(!maple_avatar_state_is_animating(&state, 1));
    assert(!maple_avatar_state_advance(&state, 500, 1, 200));
    assert(state.frame == 0);
    assert(state.elapsed_ms == 0);
    return 0;
}
