import { resolve, sep } from "node:path";
import { HttpError } from "./http.js";

export async function serveStatic(publicDir, pathname) {
  const root = resolve(publicDir);

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch (error) {
    throw new HttpError(400, "URLが正しくありません", { cause: error });
  }

  const relativePath =
    decodedPath === "/" ? "index.html" : decodedPath.slice(1);
  const filePath = resolve(root, relativePath);
  if (!filePath.startsWith(root + sep)) {
    throw new HttpError(404, "ファイルが見つかりません");
  }

  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    throw new HttpError(404, "ファイルが見つかりません");
  }
  return new Response(file);
}
