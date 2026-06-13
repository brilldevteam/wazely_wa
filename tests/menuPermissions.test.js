const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  MENU_IDS,
  createDefaultMenuPermissions,
  isMenuAllowed,
  normalizeMenuPermissions,
  parseMenuPermissions,
  resolveMenuId,
} = require("../config/menuPermissions");

const defaults = createDefaultMenuPermissions(true);
assert.strictEqual(Object.keys(defaults).length, MENU_IDS.length);
assert.strictEqual(defaults.dashboard, true);
assert.strictEqual(isMenuAllowed({}, "phonebook"), true);
assert.strictEqual(isMenuAllowed({ menu_permissions: "invalid" }, "phonebook"), true);
assert.strictEqual(
  isMenuAllowed({ menu_permissions: JSON.stringify({ phonebook: true }) }, "phonebook"),
  true,
);
assert.strictEqual(
  isMenuAllowed({ menu_permissions: JSON.stringify({ phonebook: true }) }, "inbox"),
  false,
);
assert.strictEqual(
  normalizeMenuPermissions({ dashboard: false, inbox: true }).dashboard,
  true,
);
assert.strictEqual(parseMenuPermissions(null).legacy, true);
assert.strictEqual(resolveMenuId("/api/phonebook/get_by_uid"), "phonebook");
assert.strictEqual(resolveMenuId("/api/inbox/send_templet"), "inbox");
assert.strictEqual(resolveMenuId("/api/inbox/webhook/123"), null);
assert.strictEqual(resolveMenuId("/api/inbox/embed/webhook/123"), null);
assert.strictEqual(resolveMenuId("/api/webhook/webhook/123"), null);
assert.strictEqual(
  resolveMenuId("/api/user/return_media_url_meta"),
  "create-meta-template",
);

const compiledBundle = fs.readFileSync(
  path.resolve(__dirname, "../client/public/static/js/main.fdeccb96.js"),
  "utf8",
);
assert.ok(compiledBundle.includes("window.__planMenuAllowed(e.id)"));
assert.ok(
  compiledBundle.includes(
    'window.addEventListener("plan-menu-permissions-loaded"',
  ),
);

console.log("Menu permission tests passed");
