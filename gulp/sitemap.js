const gulp = require("gulp");
const path = require("path");
const Vinyl = require("vinyl");

const siteUrl = process.env.SITE_URL;
const htmlDir = "public";

const {Transform} = require("stream");

class SitemapTransform extends Transform {
  constructor(options) {
    super(options);
    this.pages = [];
  }

  _transform(file, encoding, callback) {
    if (!/<meta [^>]*?noindex/i.test(String(file.contents))) {
      this.pages.push(file.basename);
    }
    callback();
  }

  _flush(callback) {
    const header =
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const footer = "</urlset>";
    const urlsetBody = this.pages
      .map((page) => `<url><loc>${siteUrl}/${page}</loc></url>`)
      .join("\n");

    const xml = header + "\n" + urlsetBody + "\n" + footer;

    this.push(
      new Vinyl({
        cwd: htmlDir,
        base: htmlDir,
        path: path.resolve(path.join(htmlDir, "sitemap.xml")),
        contents: Buffer.from(xml)
      })
    );

    callback();
  }
}

const sitemapTransform = new SitemapTransform({objectMode: true});

module.exports = function sitemap() {
  return gulp
    .src([htmlDir + `/*.html`], {
      base: htmlDir
    })
    .pipe(sitemapTransform)
    .pipe(gulp.dest(htmlDir));
};
