/**
 * fetch-bridge.js — isolated-world fetch proxy for MAIN-world content scripts.
 *
 * MAIN-world scripts (stn.js) cannot make cross-origin fetches to backpack.tf
 * (CORS) and cannot access chrome.storage.  This bridge runs in the isolated
 * world, which has full extension privileges, and relays fetch requests/responses
 * to/from the MAIN world via CustomEvents.
 *
 * Protocol:
 *   MAIN → isolated:  document.dispatchEvent(new CustomEvent('__bptf_fetch_request', {
 *                        detail: { id, sku }
 *                      }))
 *
 *   isolated → MAIN:  document.dispatchEvent(new CustomEvent('__bptf_fetch_result', {
 *                        detail: { id, data, error }
 *                      }))
 *
 * Each request carries a unique `id` so concurrent calls can be matched up.
 */
'use strict';

document.addEventListener('__bptf_fetch_request', async e => {
  const { id, sku } = e.detail || {};
  if (!id || !sku) return;

  let data  = null;
  let error = null;

  try {
    const result = await chrome.storage.local.get('bptfToken');
    const token  = result.bptfToken || '';
    if (!token) throw new Error('No BPTF token configured');

    const resp = await fetch(
      `https://backpack.tf/api/classifieds/listings/snapshot?sku=${encodeURIComponent(sku)}&appid=440&token=${token}`,
      { headers: { Accept: 'application/json', 'User-Agent': 'tf2-trader-extension' } }
    );
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    data = await resp.json();
  } catch (e) {
    error = e.message;
  }

  document.dispatchEvent(new CustomEvent('__bptf_fetch_result', {
    detail: { id, data, error }
  }));
});

// Generic fetch bridge for external resources (e.g., effects.json)
document.addEventListener('__generic_fetch_request', async e => {
  const { id, url } = e.detail || {};
  if (!id || !url) return;

  let data  = null;
  let error = null;

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    data = await resp.json();
  } catch (e) {
    error = e.message;
  }

  document.dispatchEvent(new CustomEvent('__generic_fetch_result', {
    detail: { id, data, error }
  }));
});
