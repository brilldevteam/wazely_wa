const logger = require("../utils/logger");

const MENU_SECTIONS = [
  {
    id: "workspace",
    label: "Workspace",
    menus: [
      ["dashboard", "Dashboard", true],
      ["inbox", "Inbox"],
      ["kabnan", "Kanban"],
      ["wa-forms", "WhatsApp Forms"],
    ],
  },
  {
    id: "instagram",
    label: "Instagram",
    menus: [
      ["link-instagram", "Link Instagram"],
      ["insta-autoreply", "Instagram Auto Reply"],
      ["insta-comment-autoreply", "Instagram Comment Auto Reply"],
    ],
  },
  {
    id: "connections",
    label: "WhatsApp Connections",
    menus: [
      ["wa-qr-connect", "Add WhatsApp by QR"],
      ["wa-warmer", "WhatsApp Warmer"],
      ["wa-qr-rest-api", "QR REST API"],
      ["wa-meta-manual", "Link Meta WhatsApp"],
    ],
  },
  {
    id: "automation",
    label: "Automation & Bots",
    menus: [
      ["automation-flows", "Automation Flows"],
      ["wa-chatbot", "WhatsApp Chatbot"],
    ],
  },
  {
    id: "broadcasting",
    label: "Broadcasting",
    menus: [
      ["create-meta-template", "Create Meta Template"],
      ["send-campaign", "Send Campaign"],
      ["campaign-dashboard", "Campaign Dashboard"],
      ["phonebook", "Phonebook"],
    ],
  },
  {
    id: "calling",
    label: "AI WhatsApp Calling",
    menus: [
      ["create-call-flow", "Create Call Flow"],
      ["wa-call-logs", "WA Call Logs"],
      ["setup-wa-call", "Setup WA Calls"],
    ],
  },
  {
    id: "meta-api",
    label: "Meta REST API",
    menus: [
      ["conversational-api", "Conversational API"],
      ["template-api", "Template API"],
      ["api-dashboard", "API Dashboard"],
    ],
  },
  {
    id: "webhooks",
    label: "Webhook Automation",
    menus: [
      ["manage-webhook", "Manage Webhooks"],
      ["webhook-automation", "Webhook Automation"],
      ["webhook-logs", "Webhook Logs"],
    ],
  },
  {
    id: "more",
    label: "More Options",
    menus: [
      ["telegram-sessions", "Telegram Sessions"],
      ["web-notificaion", "Web Notification"],
      ["agent-login", "Agent Login"],
      ["agent-task", "Agent Task"],
      ["chat-widget", "Chat Widget"],
    ],
  },
];

const MENU_IDS = MENU_SECTIONS.flatMap((section) =>
  section.menus.map(([id]) => id),
);
const MANDATORY_MENU_IDS = new Set(["dashboard"]);
const API_MENU_RULES = [
  [/^\/api\/inbox\/(?!webhook(?:\/|$)|embed\/webhook(?:\/|$))/, "inbox"],
  [/^\/api\/phonebook(?:\/|$)/, "phonebook"],
  [/^\/api\/kaban(?:\/|$)/, "kabnan"],
  [/^\/api\/chatbot(?:\/|$)/, "wa-chatbot"],
  [/^\/api\/chat_flow\/(?!.*_agent(?:\/|$))/, "automation-flows"],
  [/^\/api\/waform\/(?!submit(?:\/|$))/, "wa-forms"],
  [/^\/api\/telegram\/(?!health(?:\/|$))/, "telegram-sessions"],
  [/^\/api\/insta\/(?:auth-url|accounts|delete-account)(?:\/|$)/, "link-instagram"],
  [
    /^\/api\/broadcast\/(?:add_new|create_template_campaign)(?:\/|$)/,
    "send-campaign",
  ],
  [/^\/api\/broadcast(?:\/|$)/, "campaign-dashboard"],
  [
    /^\/api\/wa_call\/(?:insert_flow|get_flows|del_flow|fetch_el_voice)(?:\/|$)/,
    "create-call-flow",
  ],
  [/^\/api\/wa_call\/(?:call_logs|bulk_delete)(?:\/|$)/, "wa-call-logs"],
  [/^\/api\/wa_call\/(?!update_broadcast_contact(?:\/|$))/, "setup-wa-call"],
  [
    /^\/api\/qr\/(?:gen_qr|get_all|del_instance|change_instance_status)(?:\/|$)/,
    "wa-qr-connect",
  ],
  [/^\/api\/v1\/(?:get_logs|delete_logs)(?:\/|$)/, "api-dashboard"],
  [/^\/api\/webhook\/get_webhook_logs(?:\/|$)/, "webhook-logs"],
  [/^\/api\/webhook\/delete_webhook_logs(?:\/|$)/, "webhook-logs"],
  [
    /^\/api\/webhook\/(?:get_webhooks|add_webhook|update_webhook|delete_webhook)(?:\/|$)/,
    "manage-webhook",
  ],
  [
    /^\/api\/user\/(?:add_meta_templet|get_my_meta_templets|get_my_meta_templets_beta|del_meta_templet|return_media_url_meta|get_meta_keys)(?:\/|$)/,
    "create-meta-template",
  ],
  [
    /^\/api\/user\/(?:add_warmer_message|get_warmer_script|del_warmer_msg|add_ins_to_warm|get_my_warmer|change_warmer_status)(?:\/|$)/,
    "wa-warmer",
  ],
  [/^\/api\/user\/(?:add_g_auth|get_my_g_creds)(?:\/|$)/, "wa-meta-manual"],
  [
    /^\/api\/user\/(?:add_task_for_agent|get_my_agent_tasks|del_task_for_agent)(?:\/|$)/,
    "agent-task",
  ],
  [/^\/api\/user\/(?:add_widget|get_my_widget|del_widget)(?:\/|$)/, "chat-widget"],
  [
    /^\/api\/user\/(?:get_fcm_data|update_web_fcm_token|update_fcm_choice)(?:\/|$)/,
    "web-notificaion",
  ],
  [
    /^\/api\/agent\/(?:add_agent|get_my_agents|change_status_mask|change_status_allow_send|change_agent_activeness|del_agent|get_agent_chats_owner|get_assigned_chat_agent|update_agent_in_chat|del_assign_chat_by_owner)(?:\/|$)/,
    "agent-login",
  ],
];

function resolveMenuId(pathname) {
  const match = API_MENU_RULES.find(([pattern]) => pattern.test(pathname));
  return match?.[1] || null;
}

function createDefaultMenuPermissions(enabled = true) {
  return MENU_IDS.reduce((permissions, id) => {
    permissions[id] = MANDATORY_MENU_IDS.has(id) ? true : Boolean(enabled);
    return permissions;
  }, {});
}

function parseMenuPermissions(rawValue) {
  if (rawValue === null || typeof rawValue === "undefined" || rawValue === "") {
    return { permissions: null, legacy: true, invalid: false };
  }

  try {
    const parsed =
      typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;

    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error("menu_permissions must be an object");
    }

    const permissions = {};
    for (const id of MENU_IDS) {
      permissions[id] = MANDATORY_MENU_IDS.has(id)
        ? true
        : parsed[id] === true || parsed[id] === 1 || parsed[id] === "1";
    }

    return { permissions, legacy: false, invalid: false };
  } catch (error) {
    logger.error("Invalid plan menu_permissions; using legacy access", {
      error: error.message,
    });
    return { permissions: null, legacy: true, invalid: true };
  }
}

function normalizeMenuPermissions(rawValue, defaultEnabled = true) {
  if (rawValue === null || typeof rawValue === "undefined" || rawValue === "") {
    return createDefaultMenuPermissions(defaultEnabled);
  }

  const parsed = parseMenuPermissions(rawValue);
  if (parsed.invalid) {
    throw new Error("Invalid menu permissions");
  }

  return parsed.permissions;
}

function isMenuAllowed(plan, menuId) {
  if (MANDATORY_MENU_IDS.has(menuId)) {
    return true;
  }

  const parsed = parseMenuPermissions(plan?.menu_permissions);
  if (parsed.legacy) {
    return true;
  }

  return parsed.permissions[menuId] === true;
}

module.exports = {
  API_MENU_RULES,
  MENU_IDS,
  MENU_SECTIONS,
  MANDATORY_MENU_IDS,
  createDefaultMenuPermissions,
  isMenuAllowed,
  normalizeMenuPermissions,
  parseMenuPermissions,
  resolveMenuId,
};
