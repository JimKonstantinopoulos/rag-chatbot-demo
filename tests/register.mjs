// Test-only module hook: resolves the "@/" alias and extensionless .ts imports so
// node:test can load the real route and lib files. No network, no paid calls.
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

registerHooks({
  resolve(specifier, context, nextResolve) {
    let target = null;
    if (specifier.startsWith("@/")) target = path.join(root, "src", specifier.slice(2));
    else if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      target = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    }
    if (target && !path.extname(target) && existsSync(target + ".ts")) {
      return nextResolve(pathToFileURL(target + ".ts").href, context);
    }
    if (target && specifier.startsWith("@/")) return nextResolve(pathToFileURL(target).href, context);
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    return nextResolve(specifier, context);
  },
});
