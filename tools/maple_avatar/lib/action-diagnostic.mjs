/**
 * [INPUT]: 依赖小册子真实图层请求、Playwright 页面与可注入的只读探针
 * [OUTPUT]: 对外提供受次数和时间限制的单件外观定位及可读动作错误
 * [POS]: tools/maple_avatar/lib 的动作资源诊断模块，不改变抓取素材或角色搭配
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
const LAYER_ORIGIN = "https://mxdc.dvg.cn";
const LAYER_PATH = "/tools/character-builder/api/character_layers.php";
const MAX_CANDIDATES = 8;
const DEFAULT_BUDGET_MS = 5000;
const MISSING_ATTACK_MESSAGE = "部分外观尚无攻击资源";

function parseItemIds(value) {
  if (!/^\{(?:\d+(?:,\d+)*)?\}$/.test(value ?? "")) return null;
  const contents = value.slice(1, -1);
  return contents ? contents.split(",") : [];
}

function omitItem(url, key, id) {
  const ids = parseItemIds(url.searchParams.get(key));
  if (!ids) return false;
  url.searchParams.set(key, `{${ids.filter((item) => item !== id).join(",")}}`);
  return true;
}

export function isMissingAttackResource(value) {
  return value?.status === 422 && String(value.message ?? "").includes(MISSING_ATTACK_MESSAGE);
}

export async function findBlockingAppearance({
  requestUrl,
  appearances,
  probe,
  budgetMs = DEFAULT_BUDGET_MS,
  now = Date.now,
}) {
  let original;
  try {
    original = new URL(requestUrl);
  } catch {
    return null;
  }
  if (original.origin !== LAYER_ORIGIN
    || original.pathname !== LAYER_PATH
    || original.searchParams.get("action") !== "attack") return null;
  const items = parseItemIds(original.searchParams.get("items"));
  const fashionItems = parseItemIds(original.searchParams.get("fashion_items"));
  if (!items || !fashionItems || typeof probe !== "function") return null;

  const selected = new Set([...items, ...fashionItems]);
  const candidates = [...new Map((appearances ?? [])
    .filter((item) => /^\d+$/.test(item?.id ?? "")
      && selected.has(item.id)
      && String(item.name ?? "").trim())
    .map((item) => [item.id, {
      id: item.id,
      name: String(item.name ?? "").trim(),
      slot: String(item.slot ?? "").trim(),
    }])).values()];
  if (candidates.length === 0
    || candidates.length !== selected.size
    || candidates.length > MAX_CANDIDATES) return null;

  const deadline = now() + Math.min(Math.max(0, budgetMs), DEFAULT_BUDGET_MS);
  let culprit = null;
  for (const item of candidates) {
    if (now() >= deadline) return null;
    const url = new URL(original);
    if (!omitItem(url, "items", item.id) || !omitItem(url, "fashion_items", item.id)) {
      return null;
    }
    let result;
    try {
      result = await probe(url.href);
    } catch {
      return null;
    }
    if (now() >= deadline) return null;
    if (result?.status === 200 && result.success === true) {
      if (culprit) return null;
      culprit = item;
    } else if (!isMissingAttackResource(result)) {
      return null;
    }
  }
  return culprit;
}

export async function explainActionLayerFailure({
  action,
  response,
  listAppearances,
  probe,
  budgetMs = DEFAULT_BUDGET_MS,
}) {
  const status = response.status();
  let sourceMessage = "";
  if (status === 422) {
    try {
      sourceMessage = String((await response.json())?.message ?? "");
    } catch {
      // 源站错误体无法解析时只保留 HTTP 状态，不猜具体原因。
    }
  }
  if (!isMissingAttackResource({ status, message: sourceMessage })) {
    return new Error(`${action} layer request failed: HTTP ${status}`);
  }

  let culprit = null;
  try {
    const started = Date.now();
    culprit = await findBlockingAppearance({
      requestUrl: response.url(),
      appearances: await listAppearances(),
      probe,
      budgetMs: Math.max(0, budgetMs - (Date.now() - started)),
    });
  } catch {
    // 自动定位是错误说明的增强项，不得遮盖原始动作失败。
  }
  const message = culprit
    ? `${action}动作无法生成：当前搭配中的「${culprit.name}」缺少该动作资源，请在小册子更换后重试。`
    : `${action}动作无法生成：小册子提示部分外观缺少该动作资源，请更换外观后重试。`;
  const error = new Error(message);
  error.code = "ACTION_ASSET_UNAVAILABLE";
  error.action = action;
  error.item = culprit ? { id: culprit.id, name: culprit.name } : null;
  error.upstreamStatus = status;
  return error;
}

async function readSelectedAppearances(page) {
  const found = [];
  for (const label of ["装备", "时装"]) {
    const tab = page.getByRole("tab", { name: label, exact: true });
    if ((await tab.count()) === 0) continue;
    await tab.click({ timeout: 1200 });
    const cards = await page.locator('a[href*="item_info.php?id="]').evaluateAll((links) => (
      links.flatMap((link) => {
        const id = new URL(link.href).searchParams.get("id");
        const lines = String(link.parentElement?.innerText ?? "")
          .split("\n").map((line) => line.trim()).filter(Boolean);
        if (!id || !lines.some((line) => line === "已搭配" || line === "已装备")) return [];
        const [name, slot] = lines;
        if (!name) return [];
        return [{ id, name, slot: slot ?? "" }];
      })
    ));
    found.push(...cards);
  }
  return found;
}

async function probeLayerInPage(page, url) {
  return page.evaluate(async (target) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    try {
      const response = await fetch(target, {
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      });
      const body = await response.json().catch(() => null);
      return {
        status: response.status,
        success: body?.success === true,
        message: String(body?.message ?? ""),
      };
    } finally {
      clearTimeout(timer);
    }
  }, url);
}

export async function explainActionLayerFailureInPage(page, response, action) {
  return explainActionLayerFailure({
    action,
    response,
    listAppearances: () => readSelectedAppearances(page),
    probe: (url) => probeLayerInPage(page, url),
  });
}
