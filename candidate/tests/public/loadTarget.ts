import path from "node:path";
import { pathToFileURL } from "node:url";

export async function loadChatTarget() {
  const cwd = process.cwd();
  const targetRoot =
    process.env.EVAL_TARGET ??
    (path.basename(cwd) === "candidate" || path.basename(cwd) === "main" || path.basename(cwd) === "solution"
      ? cwd
      : path.join(cwd, "candidate"));
  const targetPath = path.join(targetRoot, "src", "app", "api", "chat", "route.ts");
  return import(pathToFileURL(targetPath).href) as Promise<typeof import("../../src/app/api/chat/route")>;
}

