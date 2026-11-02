/**
 * All configuration options: https://remotion.dev/docs/config
 * (Not applied when using the Node.js APIs; pass options directly there.)
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
Config.setChromiumOpenGlRenderer("angle");
// See ADR 0003: Chrome's sandboxed GPU process crashes (icu_util Check failed)
// when the browser lives under ~/Desktop (macOS privacy-protected folder).
// Use a copy outside protected folders.
Config.setBrowserExecutable(
  `${process.env.HOME}/Library/Caches/remotion-chrome/chrome-headless-shell-mac-arm64/chrome-headless-shell`,
);
