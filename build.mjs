import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(rootDir, "dist");
const publicDir = path.join(rootDir, "public");
const docsDir = path.join(rootDir, "docs");
const asyncApiPackageDir = path.join(rootDir, "node_modules", "@asyncapi", "react-component");

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "document";
}

function normalizeDocument(item, index) {
  const label = item.label || item.name || `Document ${index + 1}`;
  const url = item.url || (item.file ? `/docs/${item.file}` : null);

  if (!url) {
    return null;
  }

  return {
    id: item.id || slugify(label),
    label,
    url,
    description: item.description || "",
    file: item.file || url.replace(/^\/docs\//, "")
  };
}

async function loadDefaultConfig() {
  try {
    const registryContent = await fs.readFile(path.join(docsDir, "registry.json"), "utf8");
    const registry = JSON.parse(registryContent);
    const documents = Array.isArray(registry.documents)
      ? registry.documents.map(normalizeDocument).filter(Boolean)
      : [];

    return {
      title: registry.title || "AsyncAPI Project Docs",
      subtitle:
        registry.subtitle || "Pure preview service with a Swagger UI style document switcher",
      primaryName: registry.primaryName || null,
      documents,
      error: documents.length === 0 ? "No documents were configured." : undefined
    };
  } catch (error) {
    return {
      title: "AsyncAPI Project Docs",
      subtitle: "No document configuration found",
      primaryName: null,
      documents: [],
      error: `Failed to build default config: ${error.message}`
    };
  }
}

await fs.rm(distDir, { recursive: true, force: true });
await fs.mkdir(path.join(distDir, "assets", "asyncapi"), { recursive: true });
await fs.cp(publicDir, distDir, { recursive: true });
await fs.cp(docsDir, path.join(distDir, "docs"), { recursive: true });
await fs.copyFile(
  path.join(asyncApiPackageDir, "browser", "standalone", "index.js"),
  path.join(distDir, "assets", "asyncapi", "standalone.js")
);
await fs.copyFile(
  path.join(asyncApiPackageDir, "styles", "default.min.css"),
  path.join(distDir, "assets", "asyncapi", "default.min.css")
);

const defaultConfig = await loadDefaultConfig();
const serializedConfig = `${JSON.stringify(defaultConfig, null, 2)}\n`;
await fs.writeFile(path.join(distDir, "config.default.json"), serializedConfig);
await fs.writeFile(path.join(distDir, "config.json"), serializedConfig);
