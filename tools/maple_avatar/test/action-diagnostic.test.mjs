/**
 * [INPUT]: 依赖动作素材诊断模块与可注入的源站只读探针
 * [OUTPUT]: 验证唯一阻断外观可定位、歧义不误判且请求次数与时间有界
 * [POS]: tools/maple_avatar/test 的动作资源诊断契约测试
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  explainActionLayerFailure,
  findBlockingAppearance,
} from "../lib/action-diagnostic.mjs";

const REQUEST_URL = "https://mxdc.dvg.cn/tools/character-builder/api/character_layers.php?access=temporary&items=%7B12010%2C37807%2C24060%2C1002970%2C1012083%2C1082102%2C1051483%7D&fashion_items=%7B12010%2C37807%2C24060%2C1002970%2C1012083%2C1082102%2C1051483%7D&action=attack";
const APPEARANCES = [
  { id: "12010", name: "贵族皮肤", slot: "皮肤" },
  { id: "37807", name: "褐色细腻女孩发型", slot: "发型" },
  { id: "24060", name: "小乖乖-女脸", slot: "脸型" },
  { id: "1002970", name: "月妙头绳", slot: "帽子" },
  { id: "1012083", name: "婴儿红", slot: "脸饰" },
  { id: "1082102", name: "透明手套", slot: "手套" },
  { id: "1051483", name: "萌妹沐浴袍", slot: "套服" },
];

test("identifies the one appearance whose removal restores the attack action", async () => {
  const seen = [];
  const result = await findBlockingAppearance({
    requestUrl: REQUEST_URL,
    appearances: APPEARANCES,
    probe: async (url) => {
      const query = new URL(url).searchParams;
      seen.push(query.get("items"));
      return query.get("items").includes("1082102")
        ? { status: 422, success: false, message: "部分外观尚无攻击资源，请换装后重试" }
        : { status: 200, success: true };
    },
  });

  assert.deepEqual(result, { id: "1082102", name: "透明手套", slot: "手套" });
  assert.equal(seen.length, APPEARANCES.length);
  assert.equal(new URL(REQUEST_URL).searchParams.get("items").includes("1082102"), true);
});

test("does not blame an item when more than one removal restores the action", async () => {
  const result = await findBlockingAppearance({
    requestUrl: REQUEST_URL,
    appearances: APPEARANCES,
    probe: async (url) => {
      const items = new URL(url).searchParams.get("items");
      return !items.includes("1082102") || !items.includes("1051483")
        ? { status: 200, success: true }
        : { status: 422, message: "部分外观尚无攻击资源" };
    },
  });
  assert.equal(result, null);
});

test("does not probe when the outfit exceeds the candidate limit", async () => {
  let requests = 0;
  const result = await findBlockingAppearance({
    requestUrl: "https://mxdc.dvg.cn/tools/character-builder/api/character_layers.php?items={1,2,3,4,5,6,7,8,9}&fashion_items={}&action=attack",
    appearances: Array.from({ length: 9 }, (_, index) => ({
      id: String(index + 1), name: `外观${index + 1}`,
    })),
    probe: async () => { requests++; return { status: 200, success: true }; },
  });
  assert.equal(result, null);
  assert.equal(requests, 0);
});

test("limits read-only diagnosis to the known attack-layer request", async () => {
  let requests = 0;
  const result = await findBlockingAppearance({
    requestUrl: REQUEST_URL.replace("action=attack", "action=stand"),
    appearances: APPEARANCES,
    probe: async () => { requests++; return { status: 200, success: true }; },
  });
  assert.equal(result, null);
  assert.equal(requests, 0);
});

test("stops probing at its time budget without naming an unverified culprit", async () => {
  let currentTime = 0;
  let requests = 0;
  const result = await findBlockingAppearance({
    requestUrl: REQUEST_URL,
    appearances: APPEARANCES,
    budgetMs: 5000,
    now: () => currentTime,
    probe: async () => {
      requests++;
      currentTime = 5001;
      return { status: 200, success: true };
    },
  });
  assert.equal(result, null);
  assert.equal(requests, 1);
});

test("rejects a result that arrives after the diagnostic deadline", async () => {
  let currentTime = 0;
  const result = await findBlockingAppearance({
    requestUrl: REQUEST_URL,
    appearances: [{ id: "1082102", name: "透明手套" }],
    budgetMs: 5000,
    now: () => currentTime,
    probe: async () => {
      currentTime = 5001;
      return { status: 200, success: true };
    },
  });
  assert.equal(result, null);
});

test("requires a displayed item name before attributing the failure", async () => {
  const result = await findBlockingAppearance({
    requestUrl: REQUEST_URL,
    appearances: [{ id: "1082102", name: "  " }],
    probe: async () => ({ status: 200, success: true }),
  });
  assert.equal(result, null);
});

test("does not claim uniqueness when a selected source item is missing from the page", async () => {
  let requests = 0;
  const result = await findBlockingAppearance({
    requestUrl: REQUEST_URL,
    appearances: APPEARANCES.filter((item) => item.id !== "12010"),
    probe: async () => {
      requests++;
      return { status: 200, success: true };
    },
  });
  assert.equal(result, null);
  assert.equal(requests, 0);
});

test("turns the verified appearance into an actionable failure without changing the build", async () => {
  const error = await explainActionLayerFailure({
    action: "攻击",
    response: {
      status: () => 422,
      url: () => REQUEST_URL,
      json: async () => ({ success: false, message: "部分外观尚无攻击资源，请换装后重试" }),
    },
    listAppearances: async () => APPEARANCES,
    probe: async (url) => new URL(url).searchParams.get("items").includes("1082102")
      ? { status: 422, success: false, message: "部分外观尚无攻击资源，请换装后重试" }
      : { status: 200, success: true },
  });

  assert.equal(error.code, "ACTION_ASSET_UNAVAILABLE");
  assert.equal(error.action, "攻击");
  assert.deepEqual(error.item, { id: "1082102", name: "透明手套" });
  assert.equal(error.upstreamStatus, 422);
  assert.match(error.message, /透明手套/);
});

test("does not diagnose an upstream gateway failure as an appearance problem", async () => {
  const error = await explainActionLayerFailure({
    action: "攻击",
    response: { status: () => 502, url: () => REQUEST_URL },
    listAppearances: async () => { throw new Error("must not inspect items"); },
    probe: async () => { throw new Error("must not probe source"); },
  });

  assert.equal(error.code, undefined);
  assert.match(error.message, /HTTP 502/);
});
