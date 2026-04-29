const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || 8090);
const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, "dist");
const DOCS_DIR = path.join(DIST_DIR, "docs");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".yaml": "text/yaml; charset=utf-8",
  ".yml": "text/yaml; charset=utf-8"
};

function getTargetFile(requestUrl) {
  const parsed = new URL(requestUrl, `http://${HOST}:${PORT}`);
  const pathname = decodeURIComponent(parsed.pathname);

  if (pathname === "/healthz") {
    return { healthz: true };
  }

  if (pathname.startsWith("/raw/")) {
    const filePath = path.normalize(path.join(DOCS_DIR, pathname.slice("/raw/".length)));
    if (!filePath.startsWith(DOCS_DIR)) {
      return null;
    }

    return {
      filePath,
      contentType: "text/plain; charset=utf-8",
      cacheControl: "no-store"
    };
  }

  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(DIST_DIR, requestedPath.slice(1)));

  if (!filePath.startsWith(DIST_DIR)) {
    return null;
  }

  return { filePath };
}

async function readResponse(target) {
  if (!target) {
    return {
      status: 403,
      body: "Forbidden",
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    };
  }

  if (target.healthz) {
    return {
      status: 200,
      body: "ok",
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    };
  }

  try {
    const fileBuffer = await fs.readFile(target.filePath);
    const extension = path.extname(target.filePath).toLowerCase();
    const isConfigLike =
      target.filePath.endsWith("/config.json") || target.filePath.includes("/docs/");

    return {
      status: 200,
      body: fileBuffer,
      headers: {
        "Cache-Control": target.cacheControl || (isConfigLike ? "no-store" : "public, max-age=300"),
        "Content-Type": target.contentType || MIME_TYPES[extension] || "application/octet-stream"
      }
    };
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return {
        status: 404,
        body: "Not Found",
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      };
    }

    return {
      status: 500,
      body: "Internal Server Error",
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    };
  }
}

const server = http.createServer(async (request, response) => {
  const target = getTargetFile(request.url || "/");
  const payload = await readResponse(target);

  response.writeHead(payload.status, payload.headers);
  response.end(payload.body);
});

server.listen(PORT, HOST, () => {
  console.log(`AsyncAPI preview is running at http://${HOST}:${PORT}`);
});
