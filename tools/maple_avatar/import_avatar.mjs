#!/usr/bin/env node
/**
 * [INPUT]: Depends on a public MXDC build URL, Playwright capture, and repository output adapters.
 * [OUTPUT]: Imports one real character into provenance assets and generated firmware resources.
 * [POS]: Command-line composition root; contains argument handling but no browser or pixel logic.
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { captureAvatar } from "./lib/capture.mjs";
import { parseArguments, usage } from "./lib/cli.mjs";
import { downloadUiFont } from "./lib/font.mjs";
import { writeCapture } from "./lib/output.mjs";
import { parseBuildSource } from "./lib/source.mjs";

export async function runImport(options) {
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../.."
  );
  const source = parseBuildSource(options.source);
  const { capture, font } = await captureAvatar({
    source,
    server: options.server,
    family: options.family,
    browserPath: options.browserPath,
    fontProvider: downloadUiFont,
  });
  return writeCapture({ repoRoot, source, capture, font });
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }
  const result = await runImport(options);
  const frameCount = result.manifest.actions.reduce(
    (sum, action) => sum + action.capturedFrameCount,
    0
  );
  process.stdout.write(
    `Imported build ${result.manifest.profile.buildId}: ` +
      `${result.manifest.actions.length} actions, ${frameCount} real Canvas frames\n` +
      `Assets: ${result.assetDirectory}\n` +
      `Firmware: ${result.firmwareDirectory}\n`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`Maple avatar import failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
