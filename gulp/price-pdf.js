import {fileURLToPath} from "node:url";
import {generatePricePdf} from "../scripts/generate-price-pdf.js";

export default async function pricePdf() {
  const outputDir = fileURLToPath(
    new URL("../public/files/price/", import.meta.url)
  );
  await generatePricePdf(outputDir, {writeHtml: false});
}
