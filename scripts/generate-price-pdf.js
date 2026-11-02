import {mkdir, readFile, writeFile} from "node:fs/promises";
import {resolve, join} from "node:path";
import {pathToFileURL, fileURLToPath} from "node:url";
import pug from "pug";
import puppeteer from "puppeteer";
import {PDFDocument} from "pdf-lib";

const root = fileURLToPath(new URL("../", import.meta.url));
export const defaultOutputDir = resolve(root, "artifacts/price");

async function dataUrl(path, type) {
  const data = await readFile(resolve(root, path));
  return "data:" + type + ";base64," + data.toString("base64");
}

export async function renderPriceHtml() {
  let styles = await readFile(resolve(root, "src/pdf/price.css"), "utf8");
  for (const [token, font] of [
    ["__FONT_REGULAR__", "PTS55F_W.woff"],
    ["__FONT_BOLD__", "PTS75F_W.woff"]
  ]) {
    styles = styles.replace(
      token,
      await dataUrl("src/fonts/" + font, "font/woff")
    );
  }
  return pug.renderFile(resolve(root, "src/pdf/price.pug"), {
    styles,
    logo: await dataUrl("src/img/logo.svg", "image/svg+xml")
  });
}

export async function validatePricePdf(bytes) {
  const pdf = await PDFDocument.load(bytes);
  if (pdf.getPageCount() !== 1)
    throw new Error(
      "Price PDF must have exactly one page, got " + pdf.getPageCount()
    );
  const {width, height} = pdf.getPages()[0].getSize();
  const mmToPt = 72 / 25.4;
  if (Math.abs(width - 297 * mmToPt) > 1 || Math.abs(height - 210 * mmToPt) > 1)
    throw new Error("Price PDF must be A4 landscape");
}

// Shared by the site build and the standalone design preview.
export async function generatePricePdf(
  outputDir = defaultOutputDir,
  {writeHtml = true} = {}
) {
  const html = await renderPriceHtml();
  const browser = await puppeteer.launch({headless: true});
  let bytes;
  try {
    const page = await browser.newPage();
    await page.setViewport({width: 1055, height: 726, deviceScaleFactor: 1});
    await page.emulateMediaType("print");
    // All resources are embedded; generating the price needs no external services.
    await page.setContent(html, {waitUntil: "load"});
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => {
      const sheet = document.querySelector(".sheet");
      const bounds = sheet.getBoundingClientRect();
      const outside = [...sheet.querySelectorAll("*")].some((element) => {
        const rect = element.getBoundingClientRect();
        return rect.right > bounds.right + 1 || rect.left < bounds.left - 1;
      });
      return {
        width: bounds.width,
        height: bounds.height,
        outside,
        fonts:
          document.fonts.check('9pt "PT Sans"') &&
          document.fonts.check('700 9pt "PT Sans"'),
        images: [...document.images].every(
          (img) => img.complete && img.naturalWidth > 0
        )
      };
    });
    const mmToPx = 96 / 25.4;
    if (
      layout.height > 192 * mmToPx ||
      layout.width > 279 * mmToPx + 1 ||
      layout.outside
    )
      throw new Error(
        "Price layout exceeds A4 printable area: " + JSON.stringify(layout)
      );
    if (!layout.fonts || !layout.images)
      throw new Error("Price fonts or logo did not load");

    // Do not limit pageRanges or scale to hide overflow.
    bytes = await page.pdf({
      format: "A4",
      landscape: true,
      preferCSSPageSize: true,
      printBackground: true,
      waitForFonts: true,
      scale: 1
    });
    await validatePricePdf(bytes);
  } finally {
    await browser.close();
  }
  await mkdir(outputDir, {recursive: true});
  const pdfPath = join(outputDir, "price.pdf");
  await writeFile(pdfPath, bytes);
  if (writeHtml) await writeFile(join(outputDir, "price.html"), html);
  return pdfPath;
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
) {
  generatePricePdf()
    .then((path) => console.log("Price PDF (1 page, A4 landscape): " + path))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
}
