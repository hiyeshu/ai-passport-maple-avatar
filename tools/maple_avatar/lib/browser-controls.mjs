/**
 * [INPUT]: 依赖 Playwright 页面、浏览器可执行文件与小册子已观察到的可访问控件
 * [OUTPUT]: 对外提供浏览器启动选项、下拉选择与更新日志关闭操作
 * [POS]: tools/maple_avatar/lib 的浏览器控件适配层，供抓取器复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { existsSync } from "node:fs";

const DEFAULT_CHROME_PATH = process.platform === "darwin"
  ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  : "";

export function browserLaunchOptions(explicitPath) {
  const executablePath = explicitPath || process.env.MAPLE_AVATAR_CHROME || DEFAULT_CHROME_PATH;
  return executablePath && existsSync(executablePath)
    ? { headless: true, executablePath }
    : { headless: true };
}

export async function selectDropdownOption(page, triggerPrefix, label) {
  await page.locator(`button[aria-label^="${triggerPrefix}"]`).click();
  const option = page.getByRole("menuitemradio", { name: label, exact: true });
  await option.waitFor({ state: "visible", timeout: 5000 });
  await option.click();
}

export async function dismissReleaseNotes(page) {
  const close = page.getByRole("button", { name: "关闭更新日志", exact: true });
  if (await close.isVisible().catch(() => false)) {
    await close.click();
    await page.locator(".builder-release-overlay").waitFor({ state: "hidden", timeout: 5000 });
  }
}
