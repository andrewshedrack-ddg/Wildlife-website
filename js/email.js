/* WildGuard real-email delivery via EmailJS.
   Loads the EmailJS SDK on demand (no page script tag needed) and sends
   contact-form messages straight into the WildGuard Gmail inbox. Also
   upgrades the legacy localStorage-only window.sendEmail so admin replies
   and system emails become real emails once EmailJS is configured.
   Falls back to the old in-app inbox when EmailJS keys are not set. */
(function () {
  'use strict';
  if (window.WildGuardEmail) return;
  window.WildGuardEmail = {};

  var CONFIG = window.WILDGUARD_EMAIL_CONFIG || {};
  var SDK_URL = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4.4.1/dist/email.min.js';
  var sdkPromise = null;

  function isConfigured() {
    return !!(CONFIG.serviceId && CONFIG.templateId && CONFIG.publicKey &&
      CONFIG.serviceId.indexOf('YOUR_') !== 0);
  }

  function loadSDK() {
    if (!isConfigured()) return Promise.reject(new Error('EmailJS not configured'));
    if (window.emailjs) return Promise.resolve(window.emailjs);
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = SDK_URL;
      s.async = true;
      s.onload = function () { resolve(window.emailjs); };
      s.onerror = function () { reject(new Error('Failed to load EmailJS SDK')); };
      document.head.appendChild(s);
    });
    return sdkPromise;
  }

  function send(params) {
    return loadSDK().then(function (emailjs) {
      emailjs.init({ publicKey: CONFIG.publicKey });
      return emailjs.send(CONFIG.serviceId, CONFIG.templateId, params);
    });
  }

  /* Contact form -> WildGuard Gmail */
  window.WildGuardEmail.sendContactMessage = function (payload) {
    var p = payload || {};
    return send({
      from_name: p.name || 'Website Visitor',
      reply_to: p.email || '',
      to_email: CONFIG.toEmail || 'wildguardsociety@gmail.com',
      subject: p.subject || 'New Contact Message from WildGuard Website',
      message: p.content || p.message || '',
      site_name: CONFIG.fromName || 'WildGuard Society'
    });
  };

  /* Generic outbound email (admin replies, system notifications) -> user inbox */
  window.WildGuardEmail.sendEmail = function (to, subject, body) {
    return send({
      from_name: CONFIG.fromName || 'WildGuard Society',
      reply_to: CONFIG.toEmail || 'wildguardsociety@gmail.com',
      to_email: to || '',
      subject: subject || 'Message from WildGuard Society',
      message: body || ''
    });
  };

  window.WildGuardEmail.isConfigured = isConfigured;

  /* Upgrade the legacy window.sendEmail (in-app only) so it also sends real
     email when EmailJS is configured, then records it in the in-app inbox. */
  window.WildGuardEmail.upgradeLegacy = function () {
    if (typeof window.sendEmail !== 'function') return;
    var legacy = window.sendEmail;
    window.sendEmail = function (to, subject, body, type) {
      if (isConfigured()) {
        window.WildGuardEmail.sendEmail(to, subject, body).then(function () {
          try { legacy(to, subject, body, type); } catch (e) {}
        }).catch(function () {
          try { legacy(to, subject, body, type); } catch (e) {}
        });
      } else {
        try { legacy(to, subject, body, type); } catch (e) {}
      }
    };
  };
})();
