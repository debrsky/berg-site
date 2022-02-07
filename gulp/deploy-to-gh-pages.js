import ghPages from "gh-pages";
import path from "path";

export default function deployToGhPages(cb) {
  ghPages.publish(path.join(process.cwd(), "./public"), cb);
}
