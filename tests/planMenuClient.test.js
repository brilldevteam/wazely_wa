const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(
  path.resolve(__dirname, "../client/public/plan-menu-permissions.js"),
  "utf8",
);

function tokenFor(uid) {
  const payload = Buffer.from(JSON.stringify({ uid })).toString("base64url");
  return `header.${payload}.signature`;
}

function createRuntime(initialStorage = {}, getMeResponse = null) {
  const storage = new Map(Object.entries(initialStorage));
  const windowListeners = new Map();
  let getMeRequests = 0;

  function Storage() {}
  Storage.prototype.getItem = function (key) {
    return storage.has(key) ? storage.get(key) : null;
  };
  Storage.prototype.setItem = function (key, value) {
    storage.set(key, String(value));
  };
  Storage.prototype.removeItem = function (key) {
    storage.delete(key);
  };
  const localStorage = new Storage();

  function XMLHttpRequest() {
    this.addEventListener = () => {};
  }
  XMLHttpRequest.prototype.open = function () {};
  XMLHttpRequest.prototype.send = function () {};

  const document = {
    body: { appendChild() {} },
    documentElement: {},
    head: { appendChild() {} },
    addEventListener() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    createElement() {
      return {
        style: {},
        appendChild() {},
        addEventListener() {},
        setAttribute() {},
      };
    },
  };

  const window = {
    location: {
      href: "http://localhost:3010/user?page=dashboard",
      pathname: "/user",
    },
    history: { replaceState() {} },
    addEventListener(name, listener) {
      if (!windowListeners.has(name)) windowListeners.set(name, new Set());
      windowListeners.get(name).add(listener);
    },
    removeEventListener(name, listener) {
      windowListeners.get(name)?.delete(listener);
    },
    dispatchEvent(event) {
      windowListeners.get(event.type)?.forEach((listener) => listener(event));
    },
    fetch() {
      getMeRequests += 1;
      return Promise.resolve({
        clone() {
          return this;
        },
        json() {
          return Promise.resolve(getMeResponse);
        },
      });
    },
  };

  const context = {
    atob(value) {
      return Buffer.from(value, "base64").toString("binary");
    },
    console,
    CustomEvent: function CustomEvent() {},
    document,
    localStorage,
    MutationObserver: function MutationObserver() {
      this.observe = () => {};
    },
    PopStateEvent: function PopStateEvent() {},
    setTimeout,
    Storage,
    URL,
    window,
    XMLHttpRequest,
  };
  window.localStorage = localStorage;

  vm.runInNewContext(source, context);
  return {
    getMeRequests() {
      return getMeRequests;
    },
    localStorage,
    storage,
    window,
    windowListeners,
  };
}

async function run() {
  const firstLogin = createRuntime({
    wacrm_user: tokenFor("customer-1"),
  });
  assert.strictEqual(firstLogin.window.__planMenuAllowed("dashboard"), true);
  assert.strictEqual(firstLogin.window.__planMenuAllowed("phonebook"), false);

  const returningLogin = createRuntime({
    wacrm_user: tokenFor("customer-1"),
    "wacrm_plan_menu_permissions_customer-1": JSON.stringify({
      dashboard: true,
      phonebook: true,
      inbox: false,
    }),
  });
  assert.strictEqual(returningLogin.window.__planMenuAllowed("phonebook"), false);
  assert.strictEqual(returningLogin.window.__planMenuAllowed("inbox"), false);

  returningLogin.storage.set("wacrm_user", tokenFor("customer-2"));
  assert.strictEqual(returningLogin.window.__planMenuAllowed("phonebook"), false);

  const postLogin = createRuntime(
    {},
    {
      success: true,
      data: {
        uid: "customer-3",
        plan: JSON.stringify({
          menu_permissions: {
            dashboard: true,
            phonebook: true,
          },
        }),
      },
    },
  );
  postLogin.localStorage.setItem("wacrm_user", tokenFor("customer-3"));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.strictEqual(postLogin.getMeRequests(), 1);
  assert.strictEqual(postLogin.window.__planMenuAllowed("phonebook"), true);
  assert.strictEqual(postLogin.window.__planMenuAllowed("inbox"), false);

  const loginResponse = {
    success: true,
    token: tokenFor("customer-4"),
    uid: "customer-4",
    plan: JSON.stringify({
      menu_permissions: {
        dashboard: true,
        phonebook: true,
      },
    }),
  };
  const loginFlow = createRuntime({}, loginResponse);
  await loginFlow.window.fetch("/api/user/login", { method: "POST" });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.strictEqual(loginFlow.window.__planMenuAllowed("phonebook"), true);
  loginFlow.localStorage.setItem("wacrm_user", loginResponse.token);
  assert.strictEqual(loginFlow.window.__planMenuAllowed("phonebook"), true);

  assert.ok(
    fs
      .readFileSync(
        path.resolve(__dirname, "../client/public/static/js/main.fdeccb96.js"),
        "utf8",
      )
      .includes(
        'window.addEventListener("plan-menu-permissions-loaded",e),e()',
      ),
  );

  console.log("Client menu startup tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
