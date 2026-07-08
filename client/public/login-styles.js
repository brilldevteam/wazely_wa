(function () {
  var overlayId = "wazely-auth-refresh";
  var authPaths = ["/user/login", "/user/signup", "/admin/login"];

  function getMode() {
    if (window.location.pathname === "/admin/login") return "admin";
    return window.location.pathname === "/user/signup" ? "signup" : "login";
  }

  function isAuthPath() {
    return authPaths.indexOf(window.location.pathname) !== -1;
  }

  function featureIcon(type) {
    var icons = {
      message: '<svg viewBox="0 0 24 24" focusable="false"><path d="M5 6.5h14v8.5H8.5L5 18.5v-12Z"/><path d="M8 9.5h8"/><path d="M8 12.5h5"/></svg>',
      flow: '<svg viewBox="0 0 24 24" focusable="false"><path d="M7 7h4v4H7z"/><path d="M13 13h4v4h-4z"/><path d="M9 11v2a2 2 0 0 0 2 2h2"/><path d="M15 7h2a2 2 0 0 1 2 2v1"/></svg>',
      trigger: '<svg viewBox="0 0 24 24" focusable="false"><path d="m13 2-7 11h5l-1 9 8-12h-5l1-8Z"/></svg>',
      contacts: '<svg viewBox="0 0 24 24" focusable="false"><path d="M9.5 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M4.5 19a5 5 0 0 1 10 0"/><path d="M16 11.5a2.5 2.5 0 1 0 0-5"/><path d="M17 15a4 4 0 0 1 3 4"/></svg>',
      plug: '<svg viewBox="0 0 24 24" focusable="false"><path d="M9 7V3"/><path d="M15 7V3"/><path d="M7 7h10v4a5 5 0 0 1-10 0V7Z"/><path d="M12 16v5"/></svg>'
    };
    return '<span class="wazely-feature-icon" aria-hidden="true">' + icons[type] + '</span>';
  }

  function brandLogo() {
    return [
      '<div class="wazely-logo" aria-label="Wazely Engage">',
      '  <span class="wazely-logo-mark" aria-hidden="true"><img src="/media/gAPWnFn03mqdjjlDEiG4LSQj75BWcFRn.png" alt=""></span>',
      '  <span class="wazely-logo-word">Wazely Engage</span>',
      '</div>'
    ].join("");
  }

  function brandPanel() {
    return [
      '<aside class="wazely-brand-panel">',
      '  ' + brandLogo(),
      '  <h1>Automate your business with the power of WhatsApp</h1>',
      '  <p class="wazely-brand-copy">Sign in to your account or create a new one to get started.</p>',
      '  <div class="wazely-feature-list">',
      '    <div class="wazely-feature-item">' + featureIcon("message") + '<strong>Send bulk WhatsApp messages in seconds</strong></div>',
      '    <div class="wazely-feature-item">' + featureIcon("flow") + '<strong>Build powerful chatbot flows visually</strong></div>',
      '    <div class="wazely-feature-item">' + featureIcon("trigger") + '<strong>Automate replies with smart triggers</strong></div>',
      '    <div class="wazely-feature-item">' + featureIcon("contacts") + '<strong>Manage unlimited contacts & campaigns</strong></div>',
      '    <div class="wazely-feature-item">' + featureIcon("plug") + '<strong>Connect webhooks and third-party apps</strong></div>',
      '  </div>',
      '</aside>'
    ].join("");
  }

  function adminBrandPanel() {
    return [
      '<aside class="wazely-brand-panel wazely-admin-brand-panel">',
      '  ' + brandLogo(),
      '  <p class="wazely-admin-kicker">Admin workspace</p>',
      '  <h1>Control your WhatsApp operations with confidence</h1>',
      '  <p class="wazely-brand-copy">Access platform settings, users, plans, reports, and system controls from one protected admin area.</p>',
      '  <div class="wazely-feature-list">',
      '    <div class="wazely-feature-item">' + featureIcon("contacts") + '<strong>Review users, agents, and subscriptions</strong></div>',
      '    <div class="wazely-feature-item">' + featureIcon("flow") + '<strong>Manage plans, templates, and automation settings</strong></div>',
      '    <div class="wazely-feature-item">' + featureIcon("trigger") + '<strong>Monitor messaging activity and platform health</strong></div>',
      '    <div class="wazely-feature-item">' + featureIcon("plug") + '<strong>Configure integrations, webhooks, and API access</strong></div>',
      '    <div class="wazely-feature-item">' + featureIcon("message") + '<strong>Keep restricted admin actions protected</strong></div>',
      '  </div>',
      '</aside>'
    ].join("");
  }

  function googleIcon() {
    return [
      '<span class="wazely-google-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">',
      '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>',
      '<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>',
      '<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>',
      '<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>',
      '</svg></span>'
    ].join("");
  }

  function facebookIcon() {
    return '<span class="wazely-facebook-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.025 4.388 11.02 10.125 11.927v-8.437H7.078v-3.49h3.047V9.414c0-3.025 1.792-4.696 4.533-4.696 1.312 0 2.686.236 2.686.236v2.972H15.83c-1.491 0-1.956.931-1.956 1.887v2.26h3.328l-.532 3.49h-2.796V24C19.612 23.093 24 18.098 24 12.073z"/></svg></span>';
  }

  function socialButtons() {
    return [
      '<div class="wazely-social-grid" aria-label="Social login options">',
      '  <button type="button" class="wazely-social-button" data-google-login>' + googleIcon() + '<strong>Google</strong></button>',
      '  <button type="button" class="wazely-social-button" data-facebook-login>' + facebookIcon() + '<strong>Facebook</strong></button>',
      '</div>',
      '<div class="wazely-divider"><span>or</span></div>'
    ].join("");
  }

  function inputField(type, name, label, icon, placeholder, autocomplete, dataField) {
    return [
      '<label class="wazely-field">',
      '  <span class="wazely-field-label">' + label + '</span>',
      '  <span class="wazely-input-wrap"><span class="wazely-input-icon">' + icon + '</span><input class="wazely-input" type="' + type + '" name="' + name + '" data-field="' + dataField + '" autocomplete="' + autocomplete + '" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="' + placeholder + '" value="" required></span>',
      '</label>'
    ].join("");
  }

  function passwordField(placeholder) {
    return [
      '<label class="wazely-field">',
      '  <span class="wazely-field-label">Password</span>',
      '  <span class="wazely-input-wrap"><span class="wazely-input-icon">#</span><input class="wazely-input" type="password" name="wazely_login_secret" data-field="password" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="' + placeholder + '" value="" required><button class="wazely-password-toggle" type="button" aria-label="Show password">show</button></span>',
      '</label>'
    ].join("");
  }

  function loginForm() {
    return [
      '<h2>Sign in</h2>',
      '<p class="wazely-form-subtitle">Sign in to your account or create a new one to get started.</p>',
      socialButtons(),
      '<form class="wazely-auth-form" data-mode="login" autocomplete="off">',
      '  <div class="wazely-error" role="alert"></div>',
      inputField("email", "wazely_login_identity", "Email Address", "@", "Enter your email address", "off", "email"),
      passwordField("Enter your password"),
      '  <div class="wazely-form-row">',
      '    <label class="wazely-remember"><input type="checkbox" checked> Keep me signed in</label>',
      '    <a class="wazely-link" href="#">Forgot password?</a>',
      '  </div>',
      '  <button class="wazely-submit" type="submit">Sign In</button>',
      '</form>',
      '<p class="wazely-create">Don&apos;t have an account? <a class="wazely-link" href="/user/signup">Create Account</a></p>',
      '<p class="wazely-terms">By continuing, you agree to our <a class="wazely-link" href="/terms">Terms & Conditions</a> and <a class="wazely-link" href="/privacy">Privacy Policy</a></p>'
    ].join("");
  }

  function signupForm() {
    return [
      '<h2>Create Account</h2>',
      '<p class="wazely-form-subtitle">Create your Wazely Engage account to start managing WhatsApp campaigns and automation.</p>',
      socialButtons(),
      '<form class="wazely-auth-form" data-mode="signup" autocomplete="off">',
      '  <div class="wazely-error" role="alert"></div>',
      inputField("text", "wazely_signup_name", "Full Name", "u", "Enter your full name", "off", "name"),
      inputField("email", "wazely_signup_identity", "Email Address", "@", "Enter your email address", "off", "email"),
      inputField("tel", "wazely_signup_mobile", "Mobile Number", "+", "Enter mobile number with country code", "off", "mobile_with_country_code"),
      passwordField("Create your password"),
      '  <div class="wazely-form-row wazely-policy-row">',
      '    <label class="wazely-remember"><input type="checkbox" data-field="acceptPolicy" required> I agree to the Terms & Conditions and Privacy Policy</label>',
      '  </div>',
      '  <button class="wazely-submit" type="submit">Create Account</button>',
      '</form>',
      '<p class="wazely-create">Already have an account? <a class="wazely-link" href="/user/login">Sign In</a></p>'
    ].join("");
  }

  function adminForm() {
    return [
      '<div class="wazely-admin-form-head">',
      '  <span class="wazely-admin-badge" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z"/><path d="M9.5 12.5 11.2 14l3.4-4"/></svg></span>',
      '  <div>',
      '    <h2>Admin Portal</h2>',
      '    <p class="wazely-form-subtitle">Sign in with your admin credentials to manage Wazely Engage.</p>',
      '  </div>',
      '</div>',
      '<form class="wazely-auth-form wazely-admin-auth-form" data-mode="admin" autocomplete="off">',
      '  <div class="wazely-error" role="alert"></div>',
      inputField("email", "wazely_admin_identity", "Email Address", "@", "Enter admin email address", "off", "email"),
      passwordField("Enter admin password"),
      '  <div class="wazely-form-row wazely-admin-row">',
      '    <span class="wazely-admin-lock">Restricted access only</span>',
      '    <a class="wazely-link" href="#">Forgot password?</a>',
      '  </div>',
      '  <button class="wazely-submit" type="submit">Sign in to Admin</button>',
      '</form>',
      '<p class="wazely-admin-note">This area is only for authorized administrators. Activity may be monitored for security.</p>'
    ].join("");
  }

  function html() {
    var mode = getMode();
    return [
      '<main class="wazely-login-page' + (mode === "admin" ? " wazely-admin-page" : "") + '">',
      '  <section class="wazely-login-card" aria-label="Wazely authentication">',
      mode === "admin" ? adminBrandPanel() : brandPanel(),
      '    <section class="wazely-form-panel">',
      '      <div class="wazely-form-wrap">',
      mode === "admin" ? adminForm() : mode === "signup" ? signupForm() : loginForm(),
      '      </div>',
      '    </section>',
      '  </section>',
      '</main>'
    ].join("");
  }

  function showError(form, message, success) {
    var error = form.querySelector(".wazely-error");
    error.textContent = message || "Something went wrong. Please try again.";
    error.classList.toggle("is-success", Boolean(success));
    error.classList.add("is-visible");
  }

  function isEnabled(value) {
    return value === true || value === 1 || value === "1" || value === "true";
  }

  function loadScript(src, id) {
    return new Promise(function (resolve, reject) {
      var existing = document.getElementById(id);
      if (existing) {
        if (existing.getAttribute("data-loaded") === "true") {
          resolve();
          return;
        }
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      var script = document.createElement("script");
      script.id = id;
      script.src = src;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", function () {
        script.setAttribute("data-loaded", "true");
        resolve();
      });
      script.addEventListener("error", reject);
      document.head.appendChild(script);
    });
  }

  async function getWebConfig() {
    if (window.__wazelyAuthWebConfig) return window.__wazelyAuthWebConfig;

    var response = await fetch("/api/web/get_web_public");
    var data = await response.json();
    window.__wazelyAuthWebConfig = data && data.data ? data.data : {};
    return window.__wazelyAuthWebConfig;
  }

  async function completeSocialLogin(form, endpoint, payload) {
    var response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    var data = await response.json();

    if (data && data.success && data.token) {
      localStorage.setItem("wacrm_user", data.token);
      window.location.href = "/user";
      return;
    }

    showError(form, data && data.msg ? data.msg : "Social login could not be completed.");
  }

  async function loginWithGoogle(form) {
    try {
      var config = await getWebConfig();
      if (!isEnabled(config.google_login_active) || !config.google_client_id) {
        showError(form, "Google login is not configured yet.");
        return;
      }

      await loadScript("https://accounts.google.com/gsi/client", "google-identity-services");

      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        showError(form, "Google login could not be loaded. Please try again.");
        return;
      }

      var tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: config.google_client_id,
        scope: "openid email profile",
        callback: function (tokenResponse) {
          if (!tokenResponse || !tokenResponse.access_token) {
            showError(form, "Google login was cancelled.");
            return;
          }

          completeSocialLogin(form, "/api/user/login_with_google", {
            token: tokenResponse.access_token
          });
        }
      });

      tokenClient.requestAccessToken({ prompt: "select_account" });
    } catch (err) {
      showError(form, "Google login could not be completed. Please try again.");
    }
  }

  async function loginWithFacebook(form) {
    try {
      var config = await getWebConfig();
      if (!isEnabled(config.fb_login_active) || !config.fb_login_app_id) {
        showError(form, "Facebook login is not configured yet.");
        return;
      }

      await loadScript("https://connect.facebook.net/en_US/sdk.js", "facebook-jssdk");

      if (!window.FB) {
        showError(form, "Facebook login could not be loaded. Please try again.");
        return;
      }

      window.FB.init({
        appId: config.fb_login_app_id,
        cookie: true,
        xfbml: false,
        version: "v22.0"
      });

      window.FB.login(function (loginResponse) {
        if (!loginResponse || !loginResponse.authResponse) {
          showError(form, "Facebook login was cancelled.");
          return;
        }

        window.FB.api("/me", { fields: "name,email" }, function (profile) {
          if (!profile || !profile.email || !profile.name) {
            showError(form, "Facebook did not return the required account details.");
            return;
          }

          completeSocialLogin(form, "/api/user/login_with_facebook", {
            token: loginResponse.authResponse.accessToken,
            userId: loginResponse.authResponse.userID,
            email: profile.email,
            name: profile.name
          });
        });
      }, { scope: "email,public_profile" });
    } catch (err) {
      showError(form, "Facebook login could not be completed. Please try again.");
    }
  }

  async function preloadSocialAuth() {
    try {
      var config = await getWebConfig();
      if (isEnabled(config.google_login_active) && config.google_client_id) {
        loadScript("https://accounts.google.com/gsi/client", "google-identity-services").catch(function () {});
      }
      if (isEnabled(config.fb_login_active) && config.fb_login_app_id) {
        loadScript("https://connect.facebook.net/en_US/sdk.js", "facebook-jssdk").catch(function () {});
      }
    } catch (err) {}
  }

  function bindOverlay(overlay) {
    var form = overlay.querySelector(".wazely-auth-form");
    var password = overlay.querySelector('[data-field="password"]');
    var toggle = overlay.querySelector(".wazely-password-toggle");
    var googleButton = overlay.querySelector("[data-google-login]");
    var facebookButton = overlay.querySelector("[data-facebook-login]");

    if (googleButton || facebookButton) {
      preloadSocialAuth();
    }

    if (toggle && password) {
      toggle.addEventListener("click", function () {
        var show = password.type === "password";
        password.type = show ? "text" : "password";
        toggle.textContent = show ? "hide" : "show";
        toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
      });
    }

    if (googleButton) {
      googleButton.addEventListener("click", function () {
        loginWithGoogle(form);
      });
    }

    if (facebookButton) {
      facebookButton.addEventListener("click", function () {
        loginWithFacebook(form);
      });
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      var mode = form.getAttribute("data-mode");
      var submit = form.querySelector(".wazely-submit");
      var error = form.querySelector(".wazely-error");
      var payload = {};

      Array.prototype.forEach.call(form.querySelectorAll("[data-field]"), function (field) {
        payload[field.getAttribute("data-field")] = field.type === "checkbox" ? field.checked : field.value.trim();
      });

      error.classList.remove("is-visible", "is-success");
      submit.disabled = true;
      submit.textContent = mode === "signup" ? "Creating account..." : "Signing in...";

      try {
        var endpoint = mode === "admin" ? "/api/admin/login" : mode === "signup" ? "/api/user/signup" : "/api/user/login";
        var response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        var data = await response.json();

        if (mode === "login" && data && data.success && data.token) {
          localStorage.setItem("wacrm_user", data.token);
          window.location.href = "/user";
          return;
        }

        if (mode === "admin" && data && data.success && data.token) {
          localStorage.setItem("wacrm_admin", data.token);
          window.location.href = "/admin";
          return;
        }

        if (mode === "signup" && data && data.success) {
          showError(form, "Account created successfully. Redirecting to sign in...", true);
          setTimeout(function () {
            window.location.href = "/user/login";
          }, 900);
          return;
        }

        showError(form, data && data.msg ? data.msg : "Please check your details and try again.");
      } catch (err) {
        showError(form, "Could not reach the server. Please try again.");
      } finally {
        submit.disabled = false;
        submit.textContent = mode === "admin" ? "Sign in to Admin" : mode === "signup" ? "Create Account" : "Sign In";
      }
    });
  }

  function mount() {
    var existing = document.getElementById(overlayId);
    if (isAuthPath()) {
      document.body.classList.add("login-screen-refresh");
      if (existing) existing.remove();
      var overlay = document.createElement("div");
      overlay.id = overlayId;
      overlay.innerHTML = html();
      document.body.appendChild(overlay);
      bindOverlay(overlay);
      return;
    }

    document.body.classList.remove("login-screen-refresh");
    if (existing) existing.remove();
  }

  var pushState = history.pushState;
  var replaceState = history.replaceState;

  history.pushState = function () {
    var result = pushState.apply(this, arguments);
    setTimeout(mount, 0);
    return result;
  };

  history.replaceState = function () {
    var result = replaceState.apply(this, arguments);
    setTimeout(mount, 0);
    return result;
  };

  window.addEventListener("popstate", mount);
  window.addEventListener("load", mount);
  document.addEventListener("DOMContentLoaded", mount);
  mount();
})();
