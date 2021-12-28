import fs from "fs/promises";
import { builtinModules } from "module";
import path from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgRoot = path.resolve(__dirname, "..");

async function walk(rootPath) {
  const fileNames = await fs.readdir(rootPath);
  const walkPromises = fileNames.map(async (fileName) => {
    const filePath = path.join(rootPath, fileName);
    return (await fs.stat(filePath)).isDirectory()
      ? await walk(filePath)
      : [filePath];
  });
  return (await Promise.all(walkPromises)).flat();
}

const testPaths = (await walk(path.resolve(pkgRoot, "test"))).filter((p) =>
  /\.tsx?$/.test(p)
);

const pkg = JSON.parse(
  await fs.readFile(path.resolve(pkgRoot, "package.json"), "utf8")
);
const devDependencies = Object.keys(pkg.devDependencies ?? {});

await build({
  entryPoints: ["src/index.ts", ...testPaths],
  outbase: pkgRoot,
  outdir: "dist",
  target: "esnext",
  format: "esm",
  // "@miniflare" and "undici" are Miniflare dependencies
  external: [...builtinModules, ...devDependencies, "@miniflare", "undici"],
  logLevel: "info",
  bundle: true,
  sourcemap: true,
  color: true,
  watch: process.argv[2] === "watch",
  jsxFactory: "createElement",
  jsxFragment: "Fragment",
});
