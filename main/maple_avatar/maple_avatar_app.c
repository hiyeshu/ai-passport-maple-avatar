/**
 * [INPUT]: Depends on validated runtime avatar assets, pure view state, and LVGL widgets/timers.
 * [OUTPUT]: Renders six actions, a builder-address page, fallback recovery, and battery state.
 * [POS]: Product UI Module; owns visual objects but no partition details, BSP init, or button I/O.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "maple_avatar_app.h"

#include <stdint.h>

#include "maple_avatar_assets.h"
#include "maple_avatar_state.h"

#define ANIMATION_TICK_MS 20

static lv_obj_t *s_screen;
static lv_obj_t *s_avatar;
static lv_obj_t *s_profile_screen;
static lv_obj_t *s_builder_screen;
static lv_timer_t *s_animation_timer;
static maple_avatar_state_t s_state;
static uint32_t s_last_tick;

static const maple_avatar_action_assets_t *current_action(void)
{
    if (maple_avatar_state_is_builder_page(&s_state)) return NULL;
    return maple_avatar_assets_action(s_state.action);
}

static void refresh_avatar(void)
{
    const maple_avatar_action_assets_t *action = current_action();
    if (!s_avatar || !action || action->frame_count == 0 || !action->frames) return;
    if (s_state.frame >= action->frame_count) s_state.frame = 0;
    lv_image_set_src(s_avatar, action->frames[s_state.frame]);
}

static void set_hidden(lv_obj_t *object, bool hidden)
{
    if (!object) return;
    if (hidden) lv_obj_add_flag(object, LV_OBJ_FLAG_HIDDEN);
    else lv_obj_remove_flag(object, LV_OBJ_FLAG_HIDDEN);
}

static void refresh_view(void)
{
    const bool builder_page = maple_avatar_state_is_builder_page(&s_state);
    set_hidden(s_profile_screen, builder_page);
    set_hidden(s_avatar, builder_page);
    set_hidden(s_builder_screen, !builder_page);
    if (!builder_page) refresh_avatar();
}

static void animation_tick(lv_timer_t *timer)
{
    (void)timer;
    uint32_t now = lv_tick_get();
    uint32_t delta_ms = now - s_last_tick;
    s_last_tick = now;

    const maple_avatar_action_assets_t *action = current_action();
    if (!action) return;
    if (maple_avatar_state_advance(&s_state, delta_ms,
                                   action->frame_count,
                                   action->frame_delay_ms)) {
        refresh_avatar();
    }
}

static void add_recovery_message(lv_obj_t *parent)
{
    lv_obj_t *title = lv_label_create(parent);
    lv_obj_set_style_text_font(title, &lv_font_montserrat_20, 0);
    lv_obj_set_style_text_color(title, lv_color_hex(0xF7D884), 0);
    lv_label_set_text(title, "MiiiAo Avatar");
    lv_obj_align(title, LV_ALIGN_CENTER, 0, -48);

    lv_obj_t *url = lv_label_create(parent);
    lv_obj_set_style_text_font(url, &lv_font_montserrat_20, 0);
    lv_obj_set_style_text_color(url, lv_color_white(), 0);
    lv_label_set_text(url, "avatar.miiiao.cn");
    lv_obj_align(url, LV_ALIGN_CENTER, 0, -6);

    lv_obj_t *hint = lv_label_create(parent);
    lv_obj_set_style_text_font(hint, &lv_font_montserrat_14, 0);
    lv_obj_set_style_text_color(hint, lv_color_hex(0xB9D9E8), 0);
    lv_obj_set_style_text_align(hint, LV_TEXT_ALIGN_CENTER, 0);
    lv_label_set_text(hint, "Open on desktop\nConnect USB to install");
    lv_obj_align(hint, LV_ALIGN_CENTER, 0, 45);
}

static void add_battery_badge(lv_obj_t *parent, int battery_soc)
{
    if (battery_soc < 0 || battery_soc > 100) return;

    lv_obj_t *badge = lv_obj_create(parent);
    lv_obj_remove_flag(badge, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_set_size(badge, 50, 24);
    lv_obj_align(badge, LV_ALIGN_TOP_RIGHT, -8, 8);
    lv_obj_set_style_radius(badge, 12, 0);
    lv_obj_set_style_bg_color(badge, lv_color_hex(0x07101E), 0);
    lv_obj_set_style_bg_opa(badge, LV_OPA_70, 0);
    lv_obj_set_style_border_width(badge, 0, 0);
    lv_obj_set_style_pad_all(badge, 0, 0);

    lv_obj_t *label = lv_label_create(badge);
    lv_obj_set_style_text_font(label, &lv_font_montserrat_14, 0);
    lv_obj_set_style_text_color(label, lv_color_white(), 0);
    lv_label_set_text_fmt(label, "%d%%", battery_soc);
    lv_obj_center(label);
}

lv_obj_t *maple_avatar_app_create(int battery_soc)
{
    if (s_animation_timer) {
        lv_timer_delete(s_animation_timer);
        s_animation_timer = NULL;
    }
    if (s_screen) {
        lv_obj_delete(s_screen);
        s_screen = NULL;
    }

    maple_avatar_state_init(&s_state);
    s_avatar = NULL;
    s_profile_screen = NULL;
    s_builder_screen = NULL;
    s_screen = lv_obj_create(NULL);
    lv_obj_remove_flag(s_screen, LV_OBJ_FLAG_SCROLLABLE);
    lv_obj_set_style_bg_color(s_screen, lv_color_black(), 0);
    lv_obj_set_style_bg_opa(s_screen, LV_OPA_COVER, 0);
    lv_obj_set_style_border_width(s_screen, 0, 0);
    lv_obj_set_style_pad_all(s_screen, 0, 0);

    if (maple_avatar_assets_load()) {
        s_profile_screen = lv_image_create(s_screen);
        lv_image_set_src(s_profile_screen, maple_avatar_assets_screen());
        lv_obj_set_pos(s_profile_screen, 0, 0);

        s_builder_screen = lv_image_create(s_screen);
        lv_image_set_src(s_builder_screen, maple_avatar_assets_builder_screen());
        lv_obj_set_pos(s_builder_screen, 0, 0);

        s_avatar = lv_image_create(s_screen);
        lv_obj_set_pos(s_avatar, MAPLE_AVATAR_FRAME_X, MAPLE_AVATAR_FRAME_Y);
        refresh_view();
    } else {
        add_recovery_message(s_screen);
    }

    add_battery_badge(s_screen, battery_soc);
    lv_screen_load(s_screen);

    s_last_tick = lv_tick_get();
    if (s_avatar) {
        s_animation_timer = lv_timer_create(animation_tick, ANIMATION_TICK_MS, NULL);
    }
    return s_screen;
}

void maple_avatar_app_handle_command(maple_avatar_command_t command)
{
    if (!s_avatar) return;

    switch (command) {
        case MAPLE_AVATAR_COMMAND_PREVIOUS_ACTION:
            maple_avatar_state_previous_action(&s_state);
            refresh_view();
            break;
        case MAPLE_AVATAR_COMMAND_NEXT_ACTION:
            maple_avatar_state_next_action(&s_state);
            refresh_view();
            break;
        case MAPLE_AVATAR_COMMAND_TOGGLE_PAUSE:
            maple_avatar_state_toggle_pause(&s_state);
            break;
        default:
            break;
    }
}
