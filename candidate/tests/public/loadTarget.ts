import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export async function loadChatTarget() {
  const cwd = process.cwd();
  const targetRoot =
    process.env.EVAL_TARGET ??
    (existsSync(path.join(cwd, "src")) ? cwd : path.join(cwd, "candidate"));
  const targetPath = path.join(targetRoot, "src", "app", "api", "chat", "route.ts");
  return import(pathToFileURL(targetPath).href) as Promise<typeof import("../../src/app/api/chat/route")>;
}
