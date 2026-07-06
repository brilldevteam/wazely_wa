(function () {
  var overlayId = "wazely-auth-refresh";
  var authPaths = ["/user/login"];

  function isAuthPath() {
    return authPaths.indexOf(window.location.pathname) !== -1;
  }

  function brandPanel() {
    return [
      '<aside class="wazely-brand-panel">',
      '  <div class="wazely-logo"><span class="wazely-logo-mark">w</span><span class="wazely-logo-word">Wazely Engage</span></div>',
      '  <h1>Automate your business with the power of WhatsApp</h1>',
      '  <p class="wazely-brand-copy">Sign in to your account or create a new one to get started.</p>',
      '  <div class="wazely-feature-list">',
      '    <div class="wazely-feature-item"><span>&check;</span><strong>Send bulk WhatsApp messages in seconds</strong></div>',
      '    <div class="wazely-feature-item"><span>&check;</span><strong>Build powerful chatbot flows visually</strong></div>',
      '    <div class="wazely-feature-item"><span>&check;</span><strong>Automate replies with smart triggers</strong></div>',
      '    <div class="wazely-feature-item"><span>&check;</span><strong>Manage unlimited contacts & campaigns</strong></div>',
      '    <div class="wazely-feature-item"><span>&check;</span><strong>Connect webhooks and third-party apps</strong></div>',
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

  function html() {
    return [
      '<main class="wazely-login-page">',
      '  <section class="wazely-login-card" aria-label="Wazely authentication">',
      brandPanel(),
      '    <section class="wazely-form-panel">',
      '      <div class="wazely-form-wrap">',
      loginForm(),
      '      </div>',
      '    </section>',
      '  </section>',
      '</main>'
    ].join("");
  }

  function showError(form, message) {
    var error = form.querySelector(".wazely-error");
    error.textContent = message || "Something went wrong. Please try again.";
    error.classList.add("is-visible");
  }

  function bindOverlay(overlay) {
    var form = overlay.querySelector(".wazely-auth-form");
    var password = overlay.querySelector('[data-field="password"]');
    var toggle = overlay.querySelector(".wazely-password-toggle");
    var googleButton = overlay.querySelector("[data-google-login]");
    var facebookButton = overlay.querySelector("[data-facebook-login]");

    toggle.addEventListener("click", function () {
      var show = password.type === "password";
      password.type = show ? "text" : "password";
      toggle.textContent = show ? "hide" : "show";
      toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });

    googleButton.addEventListener("click", function () {
      showError(form, "Google login is handled by the main app configuration.");
    });

    facebookButton.addEventListener("click", function () {
      showError(form, "Facebook login is handled by the main app configuration.");
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      var submit = form.querySelector(".wazely-submit");
      var error = form.querySelector(".wazely-error");
      var email = form.querySelector('[data-field="email"]');
      var payload = {
        email: email.value.trim(),
        password: password.value.trim()
      };

      error.classList.remove("is-visible");
      submit.disabled = true;
      submit.textContent = "Signing in...";

      try {
        var response = await fetch("/api/user/login", {
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

        showError(form, data && data.msg ? data.msg : "Please check your details and try again.");
      } catch (err) {
        showError(form, "Could not reach the server. Please try again.");
      } finally {
        submit.disabled = false;
        submit.textContent = "Sign In";
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
