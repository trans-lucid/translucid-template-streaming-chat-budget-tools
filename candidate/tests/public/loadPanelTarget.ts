import path from "node:path";
import { pathToFileURL } from "node:url";

export async function loadPanelTarget() {
  const cwd = process.cwd();
  const targetRoot =
    process.env.EVAL_TARGET ??
    (path.basename(cwd) === "candidate" || path.basename(cwd) === "main" || path.basename(cwd) === "solution"
      ? cwd
      : path.join(cwd, "candidate"));
  const targetPath = path.join(targetRoot, "src", "components", "ChatPanel.tsx");
  return import(pathToFileURL(targetPath).href) as Promise<typeof import("../../src/components/ChatPanel")>;
}
