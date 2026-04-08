/* Hand-off build: copy folders and assemble a file:// friendly index.html */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = process.cwd();
const srcDir = path.join(root, "src");
const distDir = path.join(root, "dist");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function removeAssemblerScript(html) {
  // Remove any assembler.js script tags
  return html.replace(
    /<script[^>]+assembler\.js[^>]*>\s*<\/script>/gi,
    ""
  );
}

function ensureScript(html, src) {
  if (new RegExp(`src=["']${src}["']`).test(html)) return html;
  // Inject before </body>
  return html.replace(
    /<\/body>/i,
    `  <script src="${src}"></script>\n</body>`
  );
}

function injectComponent(html, id, componentHtml) {
  if (!componentHtml) return html;
  const re = new RegExp(
    `(\\<div\\s+id=["']${id}["'][^>]*\\>)([\\s\\S]*?)(\\<\\/div\\>)`,
    "i"
  );
  if (!re.test(html)) return html;
  return html.replace(re, `$1\n${componentHtml}\n$3`);
}

function compileSass() {
  // Ensure dist exists before writing
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  // Try Node API first
  try {
    const sass = require("sass");
    const entry = path.join(srcDir, "main.scss");
    console.log(`[build] Compiling SCSS via Node API: ${entry}`);
    const result = sass.compile(entry, { style: "expanded", loadPaths: [srcDir] });
    const outPath = path.join(distDir, "main.css");
    fs.writeFileSync(outPath, result.css, "utf8");
    console.log("[build] Wrote dist/main.css");
    return true;
  } catch (e) {
    console.warn("[build] Node 'sass' API not available or failed:", e.message);
  }

  // Fallback to npx
  try {
    const entry = path.join(srcDir, "main.scss");
    const outPath = path.join(distDir, "main.css");
    console.log(`[build] Compiling SCSS via npx: ${entry} -> ${outPath}`);
    execSync(`npx sass "${entry}" "${outPath}" --style=expanded`, { stdio: "inherit" });
    console.log("[build] Wrote dist/main.css");
    return true;
  } catch (e) {
    console.error("[build] Sass compile failed. Ensure:");
    console.error(" - Sass CLI installed: npm i -D sass");
    console.error(" - src/main.scss exists and has valid imports");
    console.error(" - SCSS syntax is valid (e.g., missing semicolons)");
    return false;
  }
}

function main() {
  // Clean dist
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  ensureDir(distDir);

  // Copy folders for AEM dev visibility
  copyDirSync(path.join(srcDir, "assets"), path.join(distDir, "assets"));
  copyDirSync(path.join(srcDir, "components"), path.join(distDir, "components"));
  copyDirSync(path.join(srcDir, "scripts"), path.join(distDir, "scripts"));

  // Compile CSS to dist/main.css (expanded)
  const compiled = compileSass();

  // Assemble index.html with inlined components (no fetch needed)
  const srcIndex = path.join(srcDir, "pages", "index.html");
  let html = readFileSafe(srcIndex);

  // Inject header
  let headerHtml = readFileSafe(path.join(srcDir, "components", "header", "header.html"));
  headerHtml = rewriteAssetUrls(headerHtml);
  html = injectComponent(html, "header", headerHtml);

  // Inject hero-carousel
  let heroHtml = readFileSafe(path.join(srcDir, "components", "hero-carousel", "hero-carousel.html"));
  heroHtml = rewriteAssetUrls(heroHtml);
  html = injectComponent(html, "hero-carousel", heroHtml);

  // Remove assembler for file:// usage and ensure component JS is loaded directly
  html = removeAssemblerScript(html);
  html = ensureScript(html, "components/header/header.js");
  html = ensureScript(html, "components/hero-carousel/hero-carousel.js");

  // Fix CSS link(s) to point to dist/main.css
  html = html
    .replace(/href=["'][^"']*global\.css["']/gi, 'href="main.css"')
    .replace(/href=["'][^"']*main\.css["']/gi, 'href="main.css"');

  // Also rewrite any stray asset paths in the page itself
  html = rewriteAssetUrls(html);

  // Write assembled page
  fs.writeFileSync(path.join(distDir, "index.html"), html, "utf8");

  // Ensure any asset URLs inside CSS are relative to dist
  if (compiled) {
    fixCssAssetUrls(path.join(distDir, "main.css"));
  }

  console.log("Hand-off build created in dist/.");
  console.log("- Open dist/index.html directly (file://) and it will work without a server.");
  console.log("- All components, scripts, and assets are available under dist/ for AEM integration.");
}

main();

function rewriteAssetUrls(content) {
  if (!content) return content;

  // Normalize HTML src/href -> assets/...
  content = content.replace(/((?:src|href)=["'])(?:\.{1,2}\/|\/)?assets\//gi, '$1assets/');

  // Also fix absolute project paths like /src/assets/... -> assets/...
  content = content.replace(/((?:src|href)=["'])\/src\/assets\//gi, '$1assets/');

  // Normalize CSS url(...) -> url(<opt-quote>assets/...)
  content = content.replace(/url\((['"]?)(?:\.{1,2}\/|\/)?assets\//gi, 'url($1assets/');

  // Also fix CSS url(/src/assets/...) -> url(assets/...)
  content = content.replace(/url\((['"]?)\/src\/assets\//gi, 'url($1assets/');

  return content;
}

function fixCssAssetUrls(cssPath) {
  if (!fs.existsSync(cssPath)) return;
  const css = fs.readFileSync(cssPath, "utf8");
  const fixed = rewriteAssetUrls(css);
  if (fixed !== css) {
    fs.writeFileSync(cssPath, fixed, "utf8");
  }
}