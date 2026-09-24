import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const root = process.cwd();
const sourceExtensions = [".tsx", ".ts", ".css", ".json", ".svg"];
const sharedFiles = ["app/globals.css", "app/layout.tsx", "package.json"];

function isSourceFile(file: string) {
  return sourceExtensions.some((extension) => file.endsWith(extension));
}

function isAllowedDependency(file: string) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  return relative.startsWith("components/") || relative.startsWith("lib/");
}

async function sourceFilesIn(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFilesIn(file);
    return entry.isFile() && isSourceFile(file) ? [file] : [];
  }));
  return files.flat();
}

async function resolveImport(from: string, specifier: string): Promise<string | null> {
  if (!specifier.startsWith(".")) return null;
  const base = path.resolve(path.dirname(from), specifier);
  const candidates = [base, ...sourceExtensions.map((extension) => base + extension),
    ...sourceExtensions.map((extension) => path.join(base, "index" + extension))];
  for (const candidate of candidates) {
    if (!isAllowedDependency(candidate) || !isSourceFile(candidate)) continue;
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch { /* try the next extension */ }
  }
  return null;
}

async function bundle(entry: string) {
  const directory = path.dirname(entry);
  const files = new Set(await sourceFilesIn(directory));
  const queue = [...files];
  const contents = new Map<string, string>();
  const imports = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["']([^"']+)["']/g;

  while (queue.length) {
    const file = queue.shift()!;
    const source = await readFile(file, "utf8");
    contents.set(file, source);
    for (const match of source.matchAll(imports)) {
      const dependency = await resolveImport(file, match[1]);
      if (dependency && !files.has(dependency)) {
        files.add(dependency);
        queue.push(dependency);
      }
    }
  }

  for (const file of sharedFiles) {
    contents.set(path.join(root, file), await readFile(path.join(root, file), "utf8"));
  }

  const media = new Set<string>();
  for (const source of contents.values()) {
    for (const match of source.matchAll(/\/(?:vault|holo)\/[\w./-]*/g)) media.add(match[0]);
  }

  const ordered = [entry, ...[...contents.keys()].filter((file) => file !== entry).sort()];
  const lines = [
    `SOURCE BUNDLE: ${path.relative(root, entry)}`,
    "Save each section to its labeled path relative to the project root.",
    "The original source is included, with local dependencies and shared app setup.",
    "Binary media is referenced by path and must be copied separately.",
    ...(media.size ? ["", "REFERENCED MEDIA:", ...[...media].sort().map((file) => `public${file}`)] : []),
    "",
  ];
  for (const file of ordered) {
    lines.push(`===== ${path.relative(root, file)} =====`, contents.get(file)!, "");
  }
  return lines.join("\n");
}

export async function GET(request: Request) {
  const entryPath = new URL(request.url).searchParams.get("entry");
  if (!entryPath || !/^components\/[a-z0-9-]+\/[A-Za-z0-9-]+\.tsx$/.test(entryPath)) {
    return new Response("Invalid component", { status: 400 });
  }

  const entry = path.join(root, entryPath);
  try {
    if (!(await stat(entry)).isFile()) return new Response("Component not found", { status: 404 });
    const text = await bundle(entry);
    return new Response(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch {
    return new Response("Could not assemble component source", { status: 500 });
  }
}
