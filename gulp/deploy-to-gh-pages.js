const ghPages = require("gh-pages");
const path = require("path");

function deployToGhPages(cb) {
  ghPages.publish(path.join(process.cwd(), "./public"), cb);
}
module.exports = deployToGhPages;
