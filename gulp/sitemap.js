import gulp from "gulp";
import path from "path";
import {writeFile} from "fs/promises";

export function validateSiteUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      "SITE_URL должен быть абсолютным production origin https://bergvl.ru"
    );
  }
  if (
    url.origin !== "https://bergvl.ru" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "SITE_URL должен быть production origin https://bergvl.ru без пути, параметров и авторизации"
    );
  }
  return url.origin;
}

export function indexableCanonical(html, siteUrl, basename) {
  const tags = [...html.matchAll(/<(?:meta|link)\b[^>]*>/gi)].map(([tag]) =>
    Object.fromEntries(
      [...tag.matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)].map(
        ([, key, value]) => [key.toLowerCase(), value]
      )
    )
  );
  if (
    tags.some(
      (tag) =>
        ["robots", "googlebot", "yandex"].includes(tag.name?.toLowerCase()) &&
        /\bnoindex\b/i.test(tag.content || "")
    )
  ) {
    return null;
  }
  const canonical = tags.filter((tag) => tag.rel === "canonical");
  const expected = `${siteUrl}/${basename}`;
  if (canonical.length !== 1 || canonical[0].href !== expected) {
    throw new Error(
      `Некорректный self-canonical: ${basename}, ожидался ${expected}`
    );
  }
  return expected;
}

export default async function sitemap() {
  const siteUrl = validateSiteUrl(process.env.SITE_URL);
  const pages = [];
  // Client documents remain excluded even if their meta tag is accidentally changed.
  for await (const file of gulp.src([
    "public/*.html",
    "!public/client-doc.html"
  ])) {
    const canonical = indexableCanonical(
      String(file.contents),
      siteUrl,
      file.basename
    );
    if (canonical) pages.push(canonical);
  }
  pages.sort();
  const body = pages.map((url) => `<url><loc>${url}</loc></url>`).join("\n");
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body +
    "\n</urlset>";
  await writeFile(path.join("public", "sitemap.xml"), xml, "utf8");
}
