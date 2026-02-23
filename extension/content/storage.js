/**
 * storage.js — isolated-world helper (injected before every content script).
 *
 * Provides getBPTFToken() for content scripts that run in the ISOLATED world
 * (bptf.js, scraptf.js).
 *
 * For MAIN-world scripts (stn.js, steam.js) the token is exposed on
 * window.__bptfToken by token-bridge.js instead.
 */
'use strict';

/**
 * Returns the stored backpack.tf API token, or an empty string if none saved.
 * @returns {Promise<string>}
 */
async function getBPTFToken() {
  return new Promise(resolve => {
    chrome.storage.local.get('bptfToken', result => {
      resolve(result.bptfToken || '');
    });
  });
}
