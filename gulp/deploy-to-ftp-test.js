const gulp = require("gulp");
const ftp = require("vinyl-ftp");

const connection = ftp.create({
  host: process.env.FTP_TEST_HOST,
  user: process.env.FTP_TEST_USER,
  password: process.env.FTP_TEST_PASSWORD,
  parallel: 10,
  log: console.log
});

function deployToFtpTest() {
  const globs = ["public/**", "!public/php/mailer/config.php"];

  // using base = '.' will transfer everything to destination correctly
  // turn off buffering in gulp.src for best performance

  return gulp
    .src(globs, {base: "public", buffer: false})
    .pipe(connection.newer("/")) // only upload newer files
    .pipe(connection.dest("/"));
}

module.exports = deployToFtpTest;
