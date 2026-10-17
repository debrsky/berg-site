import gulp from "gulp";
import {Readable, Transform} from "node:stream";
import {pipeline} from "node:stream/promises";
import bemValidator from "gulp-html-bem-validator";
import {htmlValidator} from "gulp-w3c-html-validator";

function stopOnInvalidHtml() {
  return new Transform({
    objectMode: true,
    transform(file, _encoding, done) {
      if (file.w3cHtmlValidator?.validates === false) {
        done(
          new Error(
            `HTML validation stopped after ${file.path}. Remaining files were not sent for validation.`
          )
        );
        return;
      }
      done(null, file);
    }
  });
}

function serviceUnavailable(result) {
  return (
    result?.status >= 400 ||
    result?.messages?.some((message) => message.type === "network-error")
  );
}

function reportSkipped(file, result) {
  const reason =
    result.messages?.find((message) => message.type === "network-error")
      ?.message || `HTTP ${result.status}`;
  console.warn(
    `W3C HTML validation: skipped (${file.path}): ${reason}. Remaining W3C checks skipped; BEM validation continues.`
  );
}

export async function validateHtmlFiles(
  files,
  {
    analyzer = () => htmlValidator.analyzer(),
    reporter = () => htmlValidator.reporter(),
    bem = () => bemValidator(),
    onSkip = reportSkipped
  } = {}
) {
  let w3cSkipped = false;
  // Wait for each result before starting another HTTP request. A service failure
  // skips only remote checks for this run; local validation and Gulp may continue.
  for await (const file of files) {
    if (!w3cSkipped) {
      await pipeline(Readable.from([file]), analyzer());
      if (serviceUnavailable(file.w3cHtmlValidator)) {
        w3cSkipped = true;
        onSkip(file, file.w3cHtmlValidator);
      } else {
        await pipeline(Readable.from([file]), reporter(), stopOnInvalidHtml());
      }
    }
    await pipeline(Readable.from([file]), bem());
  }
}

export default async function validateHTML() {
  await validateHtmlFiles(gulp.src("public/**/*.html"));
}
