/**
 * [INPUT]: 依赖 BSP 显示、电量、按键与 I2C，依赖 maple_avatar_app 的命令接口。
 * [OUTPUT]: 对外提供 ESP-IDF app_main，启动纸娃娃 UI 并分发三键事件。
 * [POS]: main 组件的组合根，只负责硬件初始化、任务生命周期与输入映射。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "bsp_battery.h"
#include "bsp_button.h"
#include "bsp_display.h"
#include "bsp_i2c.h"
#include "bsp_pins.h"
#include "maple_avatar_app.h"

#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "freertos/task.h"

static const char *TAG = "main";

#define INPUT_QUEUE_DEPTH 8

typedef struct {
    bsp_btn_t btn;
    bsp_btn_ev_t event;
} input_event_t;

static QueueHandle_t s_input_queue;
static volatile bool s_input_ready;

static void process_input(const input_event_t *input)
{
    if (input->event != BSP_BTN_CLICK) return;

    maple_avatar_command_t command;
    if (input->btn == BSP_BTN_UP) {
        command = MAPLE_AVATAR_COMMAND_PREVIOUS_ACTION;
    } else if (input->btn == BSP_BTN_DOWN) {
        command = MAPLE_AVATAR_COMMAND_NEXT_ACTION;
    } else if (input->btn == BSP_BTN_OK) {
        command = MAPLE_AVATAR_COMMAND_TOGGLE_PAUSE;
    } else {
        return;
    }

    if (!bsp_lvgl_lock(500)) return;
    maple_avatar_app_handle_command(command);
    bsp_lvgl_unlock();
}

static void input_task(void *arg)
{
    (void)arg;
    input_event_t input;
    for (;;) {
        if (xQueueReceive(s_input_queue, &input, portMAX_DELAY) == pdTRUE) {
            process_input(&input);
        }
    }
}

static esp_err_t input_dispatch_init(void)
{
    s_input_queue = xQueueCreate(INPUT_QUEUE_DEPTH, sizeof(input_event_t));
    if (!s_input_queue) return ESP_ERR_NO_MEM;
    if (xTaskCreate(input_task, "avatar_input", 3072, NULL, 5, NULL) != pdPASS) {
        vQueueDelete(s_input_queue);
        s_input_queue = NULL;
        return ESP_ERR_NO_MEM;
    }
    return ESP_OK;
}

// 按键回调运行在共享 esp_timer 任务，只入队，不触碰 LVGL。
static void on_key(bsp_btn_t btn, bsp_btn_ev_t ev, void *user)
{
    (void)user;
    if (!s_input_ready || !s_input_queue) return;
    const input_event_t input = { .btn = btn, .event = ev };
    (void)xQueueSend(s_input_queue, &input, 0);
}

void app_main(void)
{
    ESP_LOGI(TAG, "Maple Avatar 启动");

    bsp_i2c_init();
    if (bsp_display_init() != ESP_OK || !bsp_lvgl_init()) {
        ESP_LOGE(TAG, "显示/LVGL 初始化失败，纸娃娃应用无法继续。"
                      "检查 SPI 接线(MOSI=%d SCLK=%d CS=%d DC=%d BL=%d)",
                 BSP_LCD_MOSI, BSP_LCD_SCLK, BSP_LCD_CS, BSP_LCD_DC, BSP_LCD_BL);
        return;
    }
    bsp_display_backlight(100);

    int battery_soc = -1;
    esp_err_t battery_err = bsp_battery_init();
    if (battery_err == ESP_OK) {
        battery_soc = bsp_battery_soc();
    } else {
        ESP_LOGW(TAG, "电量计不可用，隐藏电量显示: %s", esp_err_to_name(battery_err));
    }

    if (bsp_lvgl_lock(1000)) {
        maple_avatar_app_create(battery_soc);
        bsp_lvgl_unlock();
    } else {
        ESP_LOGE(TAG, "无法获取 LVGL 锁，纸娃娃 UI 未创建");
        return;
    }

    esp_err_t input_err = input_dispatch_init();
    if (input_err != ESP_OK) {
        ESP_LOGE(TAG, "按键事件任务创建失败: %s", esp_err_to_name(input_err));
        return;
    }
    esp_err_t button_err = bsp_button_init(on_key, NULL);
    if (button_err != ESP_OK) {
        ESP_LOGE(TAG, "按键初始化失败，动画仍会播放: %s", esp_err_to_name(button_err));
        return;
    }
    s_input_ready = true;
    ESP_LOGI(TAG, "就绪: battery=%d%%, UP/DOWN=切换动作, OK=暂停/继续", battery_soc);
}
