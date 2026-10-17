import { resolve, sep } from "node:path";

export async function serverStatic(publicDir, pathname) {
  const root = resolve(publicDir);

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const relativePath =
    decodedPath === "/" ? "index.html" : decodedPath.slice(1);
  const filePath = resolve(root, relativePath);
  if (!filePath.startsWith(root + sep)) {
    return new Response("Not found", { status: 404 });
  }

  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(file);
}
