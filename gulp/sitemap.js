// sitemap.js
import gulp from "gulp";
import path from "path";
import {writeFile} from "fs/promises";

const siteUrl = process.env.SITE_URL;
const htmlDir = "public";

export default async function sitemap() {
  const pages = [];

  await new Promise((resolve, reject) => {
    gulp
      .src([`${htmlDir}/*.html`, `!${htmlDir}/client-doc.html`])
      .on("data", (file) => {
        if (!/<meta [^>]*?noindex/i.test(String(file.contents))) {
          pages.push(file.basename);
        }
      })
      .on("end", resolve)
      .on("error", reject);
  });

  if (pages.length === 0) {
    console.log("[sitemap] Нет страниц для добавления в sitemap");
    return;
  }

  const header =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const footer = "</urlset>";

  const urlsetBody = pages
    .map((page) => `<url><loc>${siteUrl}/${page}</loc></url>`)
    .join("\n");

  const xml = `${header}\n${urlsetBody}\n${footer}`;
  const outputPath = path.join(htmlDir, "sitemap.xml");

  await writeFile(outputPath, xml, "utf8");
}
