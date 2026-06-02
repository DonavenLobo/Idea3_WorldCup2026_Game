#!/usr/bin/env node

const fs = require("fs");
const http = require("http");
const path = require("path");

const [rootArg = "dist", portArg = "4173"] = process.argv.slice(2);
const root = path.resolve(process.cwd(), rootArg);
const port = Number(portArg);

const contentTypes = {
  ".css": "text/css",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".js": "text/javascript",
  ".json": "application/json",
  ".map": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

if (!Number.isInteger(port) || port < 0 || port >= 65536) {
  throw new Error(`Invalid port: ${portArg}`);
}

function resolveRequestPath(url = "/") {
  const pathname = decodeURIComponent(new URL(url, `http://127.0.0.1:${port}`).pathname);
  const normalizedPath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const requestedFile = path.join(root, normalizedPath);

  if (requestedFile.startsWith(root) && fs.existsSync(requestedFile) && fs.statSync(requestedFile).isFile()) {
    return requestedFile;
  }

  return path.join(root, "index.html");
}

const server = http.createServer((request, response) => {
  const filePath = resolveRequestPath(request.url);
  const extension = path.extname(filePath);

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[extension] ?? "application/octet-stream"
    });
    response.end(data);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});
