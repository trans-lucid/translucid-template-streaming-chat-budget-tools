import path from "node:path";
import { pathToFileURL } from "node:url";

export async function loadChatTarget() {
  const cwd = process.cwd();
  const targetRoot = process.env.EVAL_TARGET ?? path.join(cwd, "solution");
  const targetPath = path.join(targetRoot, "src", "app", "api", "chat", "route.ts");
  return import(pathToFileURL(targetPath).href) as Promise<typeof import("../../solution/src/app/api/chat/route")>;
}

