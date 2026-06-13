const fs = require("fs");
const path = require("path");

const bundlePath = path.resolve(
  __dirname,
  "../client/public/static/js/main.fdeccb96.js",
);
let source = fs.readFileSync(bundlePath, "utf8");

if (source.includes("window.__planMenuAllowed(e.id)")) {
  console.log("Compiled customer menu filtering is already patched");
  process.exit(0);
}

const componentStart = source.indexOf("Oge=()=>");
if (componentStart < 0) {
  throw new Error("Customer sidebar component was not found");
}

const menuEnd = source.indexOf("}],m=t.useMemo", componentStart);
if (menuEnd < 0) {
  throw new Error("Customer sidebar menu array end was not found");
}

source =
  source.slice(0, menuEnd + 2) +
  ".filter((e=>window.__planMenuAllowed?window.__planMenuAllowed(e.id):!0))" +
  source.slice(menuEnd + 2);

const popstateAnchor = "e&&(M(e),h.forEach";
const popstateIndex = source.indexOf(popstateAnchor, componentStart);
if (popstateIndex < 0) {
  throw new Error("Customer sidebar popstate handler was not found");
}

source =
  source.slice(0, popstateIndex) +
  "e&&(!window.__planMenuAllowed||window.__planMenuAllowed(e))&&(M(e),h.forEach" +
  source.slice(popstateIndex + popstateAnchor.length);

fs.writeFileSync(bundlePath, source);
console.log("Patched compiled customer menu filtering");
