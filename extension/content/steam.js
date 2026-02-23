/**
 * steam.js — steamcommunity.com inventory content script.
 *
 * Runs in world: "MAIN" (see manifest.json) so it can access the page's
 * global `g_ActiveInventory` object that Steam exposes.
 *
 * Adds a visual counter showing how many Mann Co. Supply Crate Keys
 * are in the currently viewed inventory.
 */
'use strict';

// ── Token (injected by token-bridge.js via CustomEvent) ───────
window.__bptfToken = window.__bptfToken || '';
document.addEventListener('__bptf_token_ready', e => {
  window.__bptfToken = e.detail.token || '';
}, { once: true });

const KEY_HASH = 'Mann Co. Supply Crate Key';

function createVisualCount(keys) {
  const part = document.querySelector('#tabcontent_inventory > div.filter_ctn.inventory_filters');
  if (!part) return;

  // Avoid duplicates
  if (part.querySelector('.bptf-multitool-keycount')) return;

  const visual = document.createElement('div');
  visual.className = 'hover_item_name bptf-multitool-keycount';
  visual.style.cssText = 'margin-top:6px;font-weight:bold;';
  visual.innerText = `🔑 Total pure keys: ${keys}`;
  part.appendChild(visual);
}

async function pureCount() {
  if (typeof g_ActiveInventory === 'undefined') {
    console.warn('[BPTF Multi-tool] g_ActiveInventory not found — retrying in 1 s');
    setTimeout(pureCount, 1000);
    return;
  }

  try {
    await g_ActiveInventory.LoadCompleteInventory();
  } catch (e) {
    console.warn('[BPTF Multi-tool] LoadCompleteInventory failed:', e);
  }

  const keyCount = Object.values(g_ActiveInventory.m_rgAssets || {})
    .filter(item =>
      item.description &&
      item.description.market_hash_name === KEY_HASH
    )
    .length;

  createVisualCount(keyCount);
}

// Steam's inventory JS loads asynchronously, so wait for window load.
if (document.readyState === 'complete') {
  pureCount();
} else {
  window.addEventListener('load', pureCount);
}
