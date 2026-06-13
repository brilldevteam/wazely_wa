const fs = require("fs");
const path = require("path");

const bundlePath = path.resolve(
  __dirname,
  "../client/public/static/js/main.fdeccb96.js",
);
let source = fs.readFileSync(bundlePath, "utf8");

const componentStart = source.indexOf("Oge=()=>");
if (componentStart < 0) {
  throw new Error("Customer sidebar component was not found");
}

const refreshHook =
  'const[,planMenuRefresh]=t.useState(0);t.useEffect((()=>{const e=()=>planMenuRefresh((e=>e+1));return window.addEventListener("plan-menu-permissions-loaded",e),()=>window.removeEventListener("plan-menu-permissions-loaded",e)}),[]);';

if (!source.includes('window.addEventListener("plan-menu-permissions-loaded"')) {
  const componentBodyStart = componentStart + "Oge=()=>{".length;
  source =
    source.slice(0, componentBodyStart) +
    refreshHook +
    source.slice(componentBodyStart);
}

if (!source.includes("window.__planMenuAllowed(e.id)")) {
  const menuEnd = source.indexOf("}],m=t.useMemo", componentStart);
  if (menuEnd < 0) {
    throw new Error("Customer sidebar menu array end was not found");
  }

  source =
    source.slice(0, menuEnd + 2) +
    ".filter((e=>window.__planMenuAllowed?window.__planMenuAllowed(e.id):!0))" +
    source.slice(menuEnd + 2);
}

const guardedPopstate =
  "e&&(!window.__planMenuAllowed||window.__planMenuAllowed(e))&&(M(e),h.forEach";
if (!source.includes(guardedPopstate)) {
  const popstateAnchor = "e&&(M(e),h.forEach";
  const popstateIndex = source.indexOf(popstateAnchor, componentStart);
  if (popstateIndex < 0) {
    throw new Error("Customer sidebar popstate handler was not found");
  }

  source =
    source.slice(0, popstateIndex) +
    guardedPopstate +
    source.slice(popstateIndex + popstateAnchor.length);
}

fs.writeFileSync(bundlePath, source);
console.log("Compiled customer menu permissions are patched");
