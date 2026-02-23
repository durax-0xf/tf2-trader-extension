/**
 * token-bridge.js — isolated-world bridge for MAIN-world content scripts.
 *
 * Reads the BPTF token from chrome.storage and writes it to window.__bptfToken
 * so that MAIN-world scripts (stn.js, steam.js) can access it without touching
 * chrome.storage directly (which is unavailable in world: "MAIN").
 *
 * Injected BEFORE the MAIN-world scripts via a separate isolated-world entry
 * in manifest.json.
 */
'use strict';

chrome.storage.local.get('bptfToken', result => {
  // Expose via a CustomEvent so the MAIN world can pick it up reliably,
  // regardless of script execution order.
  const token = result.bptfToken || '';

  document.dispatchEvent(new CustomEvent('__bptf_token_ready', {
    detail: { token }
  }));
});
