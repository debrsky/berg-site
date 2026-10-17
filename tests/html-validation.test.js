import {test} from "node:test";
import {strict as assert} from "node:assert";
import {Readable, Transform} from "node:stream";
import {createServer} from "node:http";
import {once} from "node:events";
import Vinyl from "vinyl";
import {htmlValidator} from "gulp-w3c-html-validator";
import {validateHtmlFiles} from "../gulp/validate-html.js";

const firstFile = "first.html";
const secondFile = "second.html";
const allFiles = [firstFile, secondFile, "third.html"];

const files = () =>
  Readable.from(
    ["first", "second", "third"].map(
      (name) =>
        new Vinyl({
          path: `/html/${name}.html`,
          contents: Buffer.from(
            "<!doctype html><html lang=ru><title>Test</title></html>"
          )
        })
    )
  );
const transform = (handle) =>
  new Transform({
    objectMode: true,
    transform(file, _encoding, done) {
      try {
        handle(file);
        done(null, file);
      } catch (error) {
        done(error);
      }
    }
  });

function validators(
  failureIndex = -1,
  failureType = "network-error",
  status = 200
) {
  const calls = {analyzed: [], reported: [], bem: [], skipped: []};
  return {
    calls,
    options: {
      analyzer: () =>
        transform((file) => {
          const index = calls.analyzed.length;
          calls.analyzed.push(file.basename);
          file.w3cHtmlValidator = {
            validates: index !== failureIndex,
            status: index === failureIndex ? status : 200,
            messages:
              index === failureIndex
                ? [{type: failureType, message: "Validation failed"}]
                : []
          };
        }),
      reporter: () =>
        transform((file) => {
          calls.reported.push(file.basename);
        }),
      bem: () =>
        transform((file) => {
          calls.bem.push(file.basename);
        }),
      onSkip: (file) => {
        calls.skipped.push(file.basename);
      }
    }
  };
}

test("HTML validation: valid files run sequentially through all stages", async () => {
  const {calls, options} = validators();
  await validateHtmlFiles(files(), options);
  const expected = allFiles;
  assert.deepEqual(calls.analyzed, expected);
  assert.deepEqual(calls.reported, expected);
  assert.deepEqual(calls.bem, expected);
});

for (const [type, status] of [
  ["network-error", 200],
  ["error", 503]
]) {
  test(`HTML validation: service failure (${type}, ${status}) skips W3C but continues BEM`, async () => {
    const {calls, options} = validators(1, type, status);
    await validateHtmlFiles(files(), options);
    assert.deepEqual(calls.analyzed, [firstFile, secondFile]);
    assert.deepEqual(calls.reported, [firstFile]);
    assert.deepEqual(calls.skipped, [secondFile]);
    assert.deepEqual(calls.bem, allFiles);
  });
}

test("HTML validation: real markup errors still abort the task", async () => {
  const {calls, options} = validators(1, "error");
  const source = files();
  await assert.rejects(
    validateHtmlFiles(source, options),
    /second.html.*Remaining files/
  );
  assert.deepEqual(calls.analyzed, [firstFile, secondFile]);
  assert.deepEqual(calls.reported, [firstFile, secondFile]);
  assert.deepEqual(calls.bem, [firstFile]);
  assert.deepEqual(calls.skipped, []);
  assert.equal(source.destroyed, true);
});

test("HTML validation: service failures print skipped instead of an error report", async (t) => {
  const warning = t.mock.method(console, "warn", () => {});
  const {calls, options} = validators(0);
  delete options.onSkip;
  await validateHtmlFiles(files(), options);
  assert.equal(warning.mock.callCount(), 1);
  assert.match(
    warning.mock.calls[0].arguments[0],
    /W3C HTML validation: skipped/
  );
  assert.deepEqual(calls.reported, []);
  assert.deepEqual(calls.bem, allFiles);
});

test("HTML validation: a new run does not retain the previous failure", async () => {
  const failed = validators(0);
  await validateHtmlFiles(files(), failed.options);
  assert.deepEqual(failed.calls.skipped, [firstFile]);
  const next = validators();
  await validateHtmlFiles(files(), next.options);
  assert.equal(next.calls.analyzed.length, 3);
});

for (const stage of ["analyzer", "reporter", "bem"]) {
  test(`HTML validation: ${stage} stream errors abort the task`, async () => {
    const {calls, options} = validators();
    options[stage] = () =>
      transform(() => {
        throw new Error(stage + " failed");
      });
    await assert.rejects(
      validateHtmlFiles(files(), options),
      new RegExp(stage + " failed")
    );
    assert.ok(calls.analyzed.length <= 1);
  });
}

for (const status of [429, 503]) {
  test(`HTML validation: HTTP ${status} resolves as skipped with one real request`, async () => {
    let requests = 0;
    const server = createServer((request, response) => {
      requests++;
      request.resume();
      response.writeHead(status, {"Content-Type": "text/plain"});
      response.end("Too Many Requests");
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    try {
      const endpoint = `http://127.0.0.1:${server.address().port}/nu/`;
      const {calls, options} = validators();
      options.analyzer = () => htmlValidator.analyzer({checkUrl: endpoint});
      options.reporter = () => htmlValidator.reporter();
      await validateHtmlFiles(files(), options);
      assert.equal(requests, 1);
      assert.deepEqual(calls.skipped, [firstFile]);
      assert.deepEqual(calls.bem, allFiles);
    } finally {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
    }
  });
}
