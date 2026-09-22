/**
 * [INPUT]: Depends on raw command-line tokens and the supported Maple server enumeration.
 * [OUTPUT]: Provides pure importer argument parsing and help text without loading Playwright.
 * [POS]: CLI trust boundary kept separate so repository host tests need no browser dependency.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { MAPLE_SERVERS } from "./source.mjs";

export const DEFAULT_SOURCE =
  "https://mxdc.dvg.cn/tools/character-builder/?build=5293&readonly=1";

export function usage() {
  return `Usage: npm run import -- [URL|BUILD_ID] [options]

Options:
  --server NAME    Override the server (${MAPLE_SERVERS.join(", ")})
  --family NAME    Override the family when the source has none
  --browser PATH   Use a specific Chromium-compatible browser executable
  --help           Show this help
`;
}

function valueAfter(args, index, option) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${option} requires a value`);
  }
  return value;
}

export function parseArguments(args) {
  const options = { source: DEFAULT_SOURCE };
  let sourceSeen = false;

  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === "--help") return { help: true };
    if (argument === "--server") {
      options.server = valueAfter(args, index, argument);
      index++;
    } else if (argument === "--family") {
      options.family = valueAfter(args, index, argument);
      index++;
    } else if (argument === "--browser") {
      options.browserPath = valueAfter(args, index, argument);
      index++;
    } else if (argument.startsWith("--")) {
      throw new Error(`Unknown option: ${argument}`);
    } else if (!sourceSeen) {
      options.source = argument;
      sourceSeen = true;
    } else {
      throw new Error(`Unexpected argument: ${argument}`);
    }
  }

  if (options.server && !MAPLE_SERVERS.includes(options.server)) {
    throw new Error(`Unsupported server: ${options.server}`);
  }
  return options;
}
