import {readFileSync} from "node:fs";
import vm from "node:vm";

const tariffSource = readFileSync(
  new URL("../../src/pug/tariffs.pug", import.meta.url),
  "utf8"
);
export const tariffs = vm.runInNewContext(
  tariffSource.slice(tariffSource.indexOf("  const tariffs")) + "; tariffs;"
);
const businessSource = readFileSync(
  new URL("../../src/pug/business-data.pug", import.meta.url),
  "utf8"
);
export const business = vm.runInNewContext(
  businessSource.slice(
    businessSource.indexOf("\n-\n") + 3,
    businessSource.indexOf("\nmixin routeSchedule")
  ) + "; business;",
  {tariffs}
);
