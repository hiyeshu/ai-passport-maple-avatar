/**
 * [INPUT]: Depends on WHATWG URL and MXDC's public character-builder URL contract.
 * [OUTPUT]: Provides source parsing, canonical URLs, profile fallbacks, and display-capacity checks.
 * [POS]: Importer's trust boundary; rejects ambiguous or unsupported external sources.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
const SOURCE_ORIGIN = "https://mxdc.dvg.cn";
const SOURCE_PATH = "/tools/character-builder/";

export const MAPLE_SERVERS = Object.freeze([
  "蓝蜗牛",
  "蘑菇仔",
  "绿水灵",
  "漂漂猪",
  "小白兔",
]);

const DEFAULT_FAMILY = "MiiiAo";
const DEFAULT_SERVER = "绿水灵";
const MAX_LEVEL = 999;
const MAX_NAME_CHARACTERS = 6;
const MAX_FAMILY_CHARACTERS = 6;
const MAX_JOB_CHARACTERS = 5;

function characterCount(value) {
  return [...String(value)].length;
}

function parseBuildId(value) {
  const text = String(value ?? "").trim();
  if (!/^[1-9]\d*$/.test(text)) {
    throw new Error(`Invalid MXDC build id: ${text || "<empty>"}`);
  }
  const buildId = Number(text);
  if (!Number.isSafeInteger(buildId)) {
    throw new Error(`MXDC build id is outside the safe integer range: ${text}`);
  }
  return buildId;
}

export function parseBuildSource(input) {
  const text = String(input ?? "").trim();
  let buildId;

  if (/^[1-9]\d*$/.test(text)) {
    buildId = parseBuildId(text);
  } else {
    let url;
    try {
      url = new URL(text);
    } catch {
      throw new Error(`Invalid MXDC character-builder URL: ${text || "<empty>"}`);
    }
    if (url.origin !== SOURCE_ORIGIN || url.pathname !== SOURCE_PATH) {
      throw new Error(`Unsupported character source: ${url.origin}${url.pathname}`);
    }
    buildId = parseBuildId(url.searchParams.get("build"));
  }

  const canonical = new URL(SOURCE_PATH, SOURCE_ORIGIN);
  canonical.searchParams.set("build", String(buildId));
  canonical.searchParams.set("readonly", "1");
  return { buildId, url: canonical.href };
}

function firstText(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

export function extractCharacterProfile(config, options = {}) {
  const build = config?.initialBuild;
  const payload = build?.payload;
  if (!build || !payload) {
    throw new Error("CHARACTER_BUILDER_CONFIG.initialBuild is missing");
  }

  const buildId = parseBuildId(build.id);
  const name = firstText(build.name, payload.n);
  const job = firstText(options.job, payload.jobName);
  const family = firstText(options.family, payload.family, payload.guild, DEFAULT_FAMILY);
  const server = firstText(options.server, payload.server, DEFAULT_SERVER);
  const level = Number(payload.l);

  if (!name) throw new Error(`Build ${buildId} has no character name`);
  if (!job) throw new Error(`Build ${buildId} has no resolved job name`);
  if (!Number.isInteger(level) || level <= 0 || level > MAX_LEVEL) {
    throw new Error(`Build ${buildId} has an invalid level: ${payload.l}`);
  }
  if (characterCount(name) > MAX_NAME_CHARACTERS) {
    throw new Error(`Build ${buildId} name exceeds ${MAX_NAME_CHARACTERS} characters: ${name}`);
  }
  if (characterCount(family) > MAX_FAMILY_CHARACTERS) {
    throw new Error(`Build ${buildId} family exceeds ${MAX_FAMILY_CHARACTERS} characters: ${family}`);
  }
  if (characterCount(job) > MAX_JOB_CHARACTERS) {
    throw new Error(`Build ${buildId} job exceeds ${MAX_JOB_CHARACTERS} characters: ${job}`);
  }
  if (!MAPLE_SERVERS.includes(server)) {
    throw new Error(`Unsupported server: ${server}`);
  }

  return {
    buildId,
    name,
    level,
    job,
    family,
    server,
    revision: firstText(build.revision),
  };
}
