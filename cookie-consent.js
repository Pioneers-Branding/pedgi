/*!
 * PEDGI cookie consent
 * - Shows a cookie banner until the visitor makes a choice (remembered for 12 months).
 * - Google Maps embeds are written as <iframe data-consent-src="..."> and only load after
 *   "Accept all" (or when the visitor clicks "Load map" on a single map).
 * - Adds a "Cookie settings" link to the footer so the choice can be changed at any time.
 * Include on every page with: <script src="cookie-consent.js" defer></script> (use ../ in subfolders).
 */
(function () {
  'use strict';

  var KEY = 'pedgi-cookie-consent';
  var VERSION = 1;
  var MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

  // Resolve links relative to this script, so pages in /services and /blog work too.
  var script = document.currentScript;
  var base = script && script.src ? script.src : location.href;
  var policyUrl = new URL('cookie-policy.html', base).href;

  /* ---------- storage ---------- */
  function readChoice() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!data || data.v !== VERSION || !data.choice) return null;
      if (Date.now() - data.ts > MAX_AGE_MS) return null;
      return data.choice; // 'all' | 'essential'
    } catch (e) {
      return null;
    }
  }

  function saveChoice(choice) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: VERSION, choice: choice, ts: Date.now() }));
    } catch (e) { /* storage blocked: choice applies to this page view only */ }
  }

  /* ---------- styles ---------- */
  var css = '' +
    '.pc-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:10000;max-width:760px;margin:0 auto;' +
    'background:#fff;color:#12313a;border:1px solid #e3ebec;border-radius:20px;box-shadow:0 18px 50px rgba(13,39,51,.18);' +
    'padding:20px 22px;display:flex;gap:18px;align-items:center;font:15px/1.55 Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
    'opacity:0;transform:translateY(16px);transition:opacity .3s ease,transform .3s ease}' +
    '.pc-banner.pc-show{opacity:1;transform:none}' +
    '.pc-banner .pc-ic{flex-shrink:0;width:44px;height:44px;border-radius:14px;background:#e6f6f8;color:#0a6b7e;display:grid;place-items:center}' +
    '.pc-banner .pc-txt{flex:1;min-width:0}' +
    '.pc-banner .pc-title{font-weight:700;font-size:16px;margin:0 0 2px;color:#0d2733}' +
    '.pc-banner p{margin:0;color:#4b6670;font-size:14px}' +
    '.pc-banner a{color:#0a6b7e;font-weight:600;text-decoration:underline;text-underline-offset:2px}' +
    '.pc-actions{display:flex;gap:10px;flex-shrink:0}' +
    '.pc-btn{font:600 14px/1 Inter,system-ui,sans-serif;padding:12px 18px;border-radius:999px;cursor:pointer;white-space:nowrap;border:2px solid #0a6b7e;transition:background .2s,color .2s}' +
    '.pc-btn-solid{background:#0a6b7e;color:#fff}.pc-btn-solid:hover{background:#064f5e;border-color:#064f5e}' +
    '.pc-btn-line{background:#fff;color:#0a6b7e}.pc-btn-line:hover{background:#e6f6f8}' +
    '.pc-btn:focus-visible,.pc-map-btn:focus-visible,.pc-settings:focus-visible{outline:3px solid #f28c38;outline-offset:2px}' +
    '@media (max-width:720px){.pc-banner{flex-direction:column;align-items:stretch;gap:14px;padding:18px}' +
    '.pc-banner .pc-ic{display:none}.pc-actions{flex-direction:column-reverse}.pc-btn{width:100%;padding:13px 18px}}' +
    '@media (prefers-reduced-motion:reduce){.pc-banner{transition:none}}' +
    /* map placeholder */
    '.pc-map-ph{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;' +
    'background:#eef5f6;border-radius:6px;color:#4b6670;font:12px/1.35 Inter,system-ui,sans-serif;padding:8px;box-sizing:border-box;width:100%}' +
    '.pc-map-ph svg{color:#0a6b7e}' +
    '.pc-map-row{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}' +
    '.pc-map-btn{font:600 12px/1 Inter,system-ui,sans-serif;padding:7px 11px;border-radius:999px;border:1px solid #0a6b7e;cursor:pointer;text-decoration:none}' +
    '.pc-map-load{background:#0a6b7e;color:#fff}.pc-map-open{background:#fff;color:#0a6b7e}' +
    /* footer link */
    '.pc-settings{background:none;border:0;padding:0;font:inherit;color:inherit;text-decoration:underline;text-underline-offset:2px;cursor:pointer;opacity:.85}' +
    '.pc-settings:hover{opacity:1}' +
    '.pc-footer-links{display:inline-flex;gap:14px;flex-wrap:wrap}.pc-footer-links a{color:inherit;text-decoration:underline;text-underline-offset:2px;opacity:.85}';

  function addStyles() {
    var s = document.createElement('style');
    s.id = 'pc-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  /* ---------- Google Maps embeds ---------- */
  var MAP_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';

  function mapsSearchLink(embedUrl) {
    // Embed URLs carry the address as "!2s<address>!" — reuse it for a normal Google Maps link.
    var m = /!2s([^!]+)/.exec(embedUrl || '');
    var q = m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
    return q ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q) : 'https://www.google.com/maps';
  }

  function loadMap(frame) {
    var ph = frame.previousElementSibling;
    if (ph && ph.classList.contains('pc-map-ph')) ph.remove();
    frame.style.display = '';
    if (frame.getAttribute('src') !== frame.dataset.consentSrc) frame.src = frame.dataset.consentSrc;
  }

  function blockMap(frame) {
    if (frame.getAttribute('src')) frame.removeAttribute('src');
    if (frame.previousElementSibling && frame.previousElementSibling.classList.contains('pc-map-ph')) return;
    var h = parseInt(frame.getAttribute('height'), 10) || frame.offsetHeight || 150;
    var ph = document.createElement('div');
    ph.className = 'pc-map-ph';
    ph.style.minHeight = h + 'px';
    var label = frame.getAttribute('title') || 'Map';
    ph.innerHTML = MAP_ICON + '<span>Map hidden until you allow Google cookies</span>' +
      '<span class="pc-map-row">' +
      '<button type="button" class="pc-map-btn pc-map-load"></button>' +
      '<a class="pc-map-btn pc-map-open" target="_blank" rel="noopener">Open ↗</a></span>';
    var btn = ph.querySelector('.pc-map-load');
    btn.textContent = 'Load map';
    btn.setAttribute('aria-label', 'Load ' + label + ' (Google Maps may set cookies)');
    var open = ph.querySelector('.pc-map-open');
    open.href = mapsSearchLink(frame.dataset.consentSrc);
    open.setAttribute('aria-label', 'Open ' + label + ' in Google Maps');
    btn.addEventListener('click', function () { loadMap(frame); });
    frame.style.display = 'none';
    frame.parentNode.insertBefore(ph, frame);
  }

  function applyChoice(choice) {
    var frames = document.querySelectorAll('iframe[data-consent-src]');
    for (var i = 0; i < frames.length; i++) {
      if (choice === 'all') loadMap(frames[i]); else blockMap(frames[i]);
    }
  }

  /* ---------- banner ---------- */
  var banner = null;
  var lastFocus = null;

  function closeBanner() {
    if (!banner) return;
    var b = banner;
    banner = null;
    b.classList.remove('pc-show');
    setTimeout(function () { b.remove(); }, 300);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function choose(choice) {
    saveChoice(choice);
    applyChoice(choice);
    closeBanner();
  }

  function showBanner(fromSettings) {
    if (banner) return;
    lastFocus = fromSettings ? document.activeElement : null;
    banner = document.createElement('div');
    banner.className = 'pc-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie preferences');
    banner.innerHTML =
      '<div class="pc-ic" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">' +
      '<path d="M21.6 11.3a3 3 0 0 1-3.5-3.4 3 3 0 0 1-3.9-3.9A10 10 0 1 0 22 12c0-.2 0-.5-.4-.7zM8 9.5A1.5 1.5 0 1 1 8 12.5 1.5 1.5 0 0 1 8 9.5zm1 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/></svg></div>' +
      '<div class="pc-txt"><p class="pc-title">We value your privacy</p>' +
      '<p>We don’t use advertising or tracking cookies. With your OK, we load Google Maps, which may set its own cookies. ' +
      '<a class="pc-policy">Cookie policy</a></p></div>' +
      '<div class="pc-actions">' +
      '<button type="button" class="pc-btn pc-btn-line" data-choice="essential">Essential only</button>' +
      '<button type="button" class="pc-btn pc-btn-solid" data-choice="all">Accept all</button></div>';
    banner.querySelector('.pc-policy').href = policyUrl;
    banner.addEventListener('click', function (e) {
      var c = e.target.closest('[data-choice]');
      if (c) choose(c.getAttribute('data-choice'));
    });
    document.body.appendChild(banner);
    requestAnimationFrame(function () { requestAnimationFrame(function () { banner && banner.classList.add('pc-show'); }); });
    if (fromSettings) banner.querySelector('[data-choice="all"]').focus();
  }

  /* ---------- footer link ---------- */
  function addFooterLinks() {
    var bottom = document.querySelector('.footer-bottom');
    if (!bottom || bottom.querySelector('.pc-settings')) return;
    var wrap = document.createElement('span');
    wrap.className = 'pc-footer-links';
    var policy = document.createElement('a');
    policy.href = policyUrl;
    policy.textContent = 'Cookie Policy';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pc-settings';
    btn.textContent = 'Cookie settings';
    btn.addEventListener('click', function () { showBanner(true); });
    wrap.appendChild(policy);
    wrap.appendChild(btn);
    bottom.appendChild(wrap);
  }

  /* ---------- init ---------- */
  function init() {
    addStyles();
    var choice = readChoice();
    applyChoice(choice === 'all' ? 'all' : 'essential');
    addFooterLinks();
    if (!choice) showBanner(false);
    // Public hook, e.g. <a href="#" onclick="PedgiCookies.open();return false">Cookie settings</a>
    window.PedgiCookies = { open: function () { showBanner(true); }, choice: readChoice };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
