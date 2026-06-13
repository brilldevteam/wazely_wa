(function () {
  "use strict";

  var sections = [
    ["Workspace", [["dashboard", "Dashboard", true], ["inbox", "Inbox"], ["kabnan", "Kanban"], ["wa-forms", "WhatsApp Forms"]]],
    ["Instagram", [["link-instagram", "Link Instagram"], ["insta-autoreply", "Instagram Auto Reply"], ["insta-comment-autoreply", "Instagram Comment Auto Reply"]]],
    ["WhatsApp Connections", [["wa-qr-connect", "Add WhatsApp by QR"], ["wa-warmer", "WhatsApp Warmer"], ["wa-qr-rest-api", "QR REST API"], ["wa-meta-manual", "Link Meta WhatsApp"]]],
    ["Automation & Bots", [["automation-flows", "Automation Flows"], ["wa-chatbot", "WhatsApp Chatbot"]]],
    ["Broadcasting", [["create-meta-template", "Create Meta Template"], ["send-campaign", "Send Campaign"], ["campaign-dashboard", "Campaign Dashboard"], ["phonebook", "Phonebook"]]],
    ["AI WhatsApp Calling", [["create-call-flow", "Create Call Flow"], ["wa-call-logs", "WA Call Logs"], ["setup-wa-call", "Setup WA Calls"]]],
    ["Meta REST API", [["conversational-api", "Conversational API"], ["template-api", "Template API"], ["api-dashboard", "API Dashboard"]]],
    ["Webhook Automation", [["manage-webhook", "Manage Webhooks"], ["webhook-automation", "Webhook Automation"], ["webhook-logs", "Webhook Logs"]]],
    ["More Options", [["telegram-sessions", "Telegram Sessions"], ["web-notificaion", "Web Notification"], ["agent-login", "Agent Login"], ["agent-task", "Agent Task"], ["chat-widget", "Chat Widget"]]]
  ];

  var menuIds = sections.reduce(function (ids, section) {
    return ids.concat(section[1].map(function (menu) { return menu[0]; }));
  }, []);
  var currentPermissions = null;
  var plans = [];
  var activeAdminPermissions = null;

  function defaults(enabled) {
    return menuIds.reduce(function (result, id) {
      result[id] = id === "dashboard" ? true : Boolean(enabled);
      return result;
    }, {});
  }

  function parsePermissions(value, legacyDefault) {
    if (value === null || typeof value === "undefined" || value === "") {
      return legacyDefault ? defaults(true) : null;
    }

    try {
      var parsed = typeof value === "string" ? JSON.parse(value) : value;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        return legacyDefault ? defaults(true) : null;
      }
      return menuIds.reduce(function (result, id) {
        result[id] = id === "dashboard" ? true : parsed[id] === true || parsed[id] === 1 || parsed[id] === "1";
        return result;
      }, {});
    } catch (error) {
      return legacyDefault ? defaults(true) : null;
    }
  }

  window.__planMenuAllowed = function (menuId) {
    return menuId === "dashboard" || currentPermissions === null || currentPermissions[menuId] === true;
  };

  function showRedirectNotice() {
    if (document.querySelector("[data-plan-menu-notice]")) return;
    var notice = document.createElement("div");
    notice.setAttribute("data-plan-menu-notice", "true");
    notice.textContent = "This feature is not included in your current plan.";
    notice.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:20000;padding:12px 18px;border-radius:8px;background:#3b1618;color:#ffb4ab;font:500 14px Roboto,Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3)";
    document.body.appendChild(notice);
    setTimeout(function () { notice.remove(); }, 4000);
  }

  function guardCurrentPage() {
    if (!window.location.pathname.startsWith("/user")) return;
    var url = new URL(window.location.href);
    var page = url.searchParams.get("page");
    if (!page || window.__planMenuAllowed(page)) return;
    url.searchParams.set("page", "dashboard");
    window.history.replaceState({}, "", url.pathname + "?" + url.searchParams.toString());
    window.dispatchEvent(new PopStateEvent("popstate"));
    showRedirectNotice();
  }

  function consumeResponse(url, data) {
    if (!data || typeof data !== "object") return;
    if (url.indexOf("/api/user/get_me") !== -1 && data.success && data.data) {
      var plan = data.data.plan;
      try {
        plan = typeof plan === "string" ? JSON.parse(plan) : plan;
      } catch (error) {
        plan = null;
      }
      currentPermissions = parsePermissions(plan && plan.menu_permissions, false);
      guardCurrentPage();
      window.dispatchEvent(new CustomEvent("plan-menu-permissions-loaded"));
    }
    if (url.indexOf("/api/admin/get_plans") !== -1 && data.success) {
      plans = Array.isArray(data.data) ? data.data : [];
      window.dispatchEvent(new CustomEvent("admin-plan-permissions-loaded"));
    }
  }

  function enhanceRequestBody(url, body) {
    if (
      url.indexOf("/api/admin/add_plan") === -1 &&
      url.indexOf("/api/admin/update_plan_data") === -1
    ) return body;
    if (!activeAdminPermissions || typeof body !== "string") return body;
    try {
      var parsed = JSON.parse(body);
      parsed.menu_permissions = activeAdminPermissions;
      return JSON.stringify(parsed);
    } catch (error) {
      return body;
    }
  }

  var originalFetch = window.fetch;
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : input.url;
    var options = init ? Object.assign({}, init) : {};
    if (typeof options.body === "string") options.body = enhanceRequestBody(url, options.body);
    return originalFetch.call(this, input, options).then(function (response) {
      response.clone().json().then(function (data) { consumeResponse(url, data); }).catch(function () {});
      return response;
    });
  };

  var originalOpen = XMLHttpRequest.prototype.open;
  var originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__planMenuUrl = String(url);
    return originalOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function (body) {
    var request = this;
    var url = request.__planMenuUrl || "";
    request.addEventListener("load", function () {
      try { consumeResponse(url, JSON.parse(request.responseText)); } catch (error) {}
    });
    return originalSend.call(this, enhanceRequestBody(url, body));
  };

  function findPlanForDialog(dialog) {
    var titleInput = dialog.querySelector('input[type="text"]');
    var title = titleInput ? titleInput.value.trim() : "";
    return plans.find(function (plan) {
      return String(plan.title || "").trim() === title;
    }) || null;
  }

  function createSwitch(menu, permissions, onChange) {
    var row = document.createElement("label");
    row.className = "plan-menu-permission-row";
    var text = document.createElement("span");
    text.textContent = menu[1];
    row.appendChild(text);
    var input = document.createElement("input");
    input.type = "checkbox";
    input.checked = menu[2] === true || permissions[menu[0]] === true;
    input.disabled = menu[2] === true;
    input.addEventListener("change", function () {
      permissions[menu[0]] = input.checked;
      onChange();
    });
    row.appendChild(input);
    return row;
  }

  function renderAdminPanel(dialog) {
    if (dialog.querySelector("[data-plan-menu-editor]")) return;
    if (dialog.textContent.indexOf("Features & Permissions") === -1) return;
    var plan = findPlanForDialog(dialog);
    activeAdminPermissions = parsePermissions(plan && plan.menu_permissions, true) || defaults(true);

    var panel = document.createElement("section");
    panel.setAttribute("data-plan-menu-editor", "true");
    panel.className = "plan-menu-permission-panel";
    var heading = document.createElement("div");
    heading.className = "plan-menu-permission-heading";
    heading.innerHTML = "<strong>Customer Menu Access</strong><span>Dashboard is always available. Existing feature and add-on rules still apply.</span>";
    panel.appendChild(heading);

    sections.forEach(function (section) {
      var group = document.createElement("details");
      group.open = section[0] === "Workspace";
      var summary = document.createElement("summary");
      var label = document.createElement("span");
      label.textContent = section[0];
      summary.appendChild(label);
      var configurableMenus = section[1].filter(function (menu) { return menu[2] !== true; });
      var groupSwitch = document.createElement("input");
      groupSwitch.type = "checkbox";
      groupSwitch.checked = configurableMenus.every(function (menu) { return activeAdminPermissions[menu[0]]; });
      groupSwitch.addEventListener("click", function (event) { event.stopPropagation(); });
      groupSwitch.addEventListener("change", function () {
        configurableMenus.forEach(function (menu) { activeAdminPermissions[menu[0]] = groupSwitch.checked; });
        group.querySelectorAll(".plan-menu-permission-row input:not(:disabled)").forEach(function (input) {
          input.checked = groupSwitch.checked;
        });
      });
      summary.appendChild(groupSwitch);
      group.appendChild(summary);
      var rows = document.createElement("div");
      rows.className = "plan-menu-permission-rows";
      section[1].forEach(function (menu) {
        rows.appendChild(createSwitch(menu, activeAdminPermissions, function () {
          groupSwitch.checked = configurableMenus.every(function (item) {
            return activeAdminPermissions[item[0]];
          });
        }));
      });
      group.appendChild(rows);
      panel.appendChild(group);
    });

    (dialog.querySelector(".MuiDialogContent-root") || dialog).appendChild(panel);
  }

  function scanDialogs() {
    var found = false;
    document.querySelectorAll('[role="dialog"]').forEach(function (dialog) {
      if (dialog.textContent.indexOf("Features & Permissions") !== -1) {
        found = true;
        renderAdminPanel(dialog);
      }
    });
    if (!found) activeAdminPermissions = null;
  }

  var style = document.createElement("style");
  style.textContent =
    ".plan-menu-permission-panel{margin-top:24px;padding:18px;border:1px solid rgba(128,128,128,.28);border-radius:12px;font:400 14px Roboto,Arial,sans-serif}" +
    ".plan-menu-permission-heading{display:flex;flex-direction:column;gap:4px;margin-bottom:14px}.plan-menu-permission-heading strong{font-size:15px}.plan-menu-permission-heading span{font-size:12px;opacity:.7}" +
    ".plan-menu-permission-panel details{border-top:1px solid rgba(128,128,128,.2)}.plan-menu-permission-panel summary{display:flex;align-items:center;justify-content:space-between;padding:12px 4px;cursor:pointer;font-weight:600}" +
    ".plan-menu-permission-rows{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:0 0 12px}.plan-menu-permission-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid rgba(128,128,128,.2);border-radius:8px}" +
    ".plan-menu-permission-panel input[type=checkbox]{width:18px;height:18px;accent-color:#6c63ff}@media(max-width:700px){.plan-menu-permission-rows{grid-template-columns:1fr}}";
  document.head.appendChild(style);

  var scanTimer;
  new MutationObserver(function () {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scanDialogs, 50);
  }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("admin-plan-permissions-loaded", scanDialogs);
  window.addEventListener("popstate", guardCurrentPage);
  document.addEventListener("DOMContentLoaded", scanDialogs);
})();
