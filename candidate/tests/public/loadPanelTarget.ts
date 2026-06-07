import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function loadPanelTarget() {
  const cwd = process.cwd();
  const targetRoot =
    process.env.EVAL_TARGET ??
    (existsSync(path.join(cwd, "src")) ? cwd : path.join(cwd, "candidate"));
  const targetPath = path.join(targetRoot, "src", "components", "ChatPanel.tsx");
  return import(pathToFileURL(targetPath).href) as Promise<typeof import("../../src/components/ChatPanel")>;
}
