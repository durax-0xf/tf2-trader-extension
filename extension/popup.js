'use strict';

// ── Tab switching ─────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(target).classList.add('active');
  });
});

// ── URL builders (mirrored from content/utils.js) ─────────────
function format2BPTF(name, effectId) {
  // name should already be just the hat name without "Unusual " prefix and without effect
  return `https://backpack.tf/stats/Unusual/${encodeURIComponent(name.trim())}/Tradable/Craftable/${effectId}`;
}
function format2STN(name, effectName) {
  return `https://stntrading.eu/item/tf2/Unusual%20${encodeURIComponent(effectName)}%20${encodeURIComponent(name.trim())}`;
}
function format2MPTF(defIndex, effId) {
  return `https://marketplace.tf/items/tf2/${defIndex};5;u${effId}`;
}

// ── Parse "Burning Flames Team Captain" → { effect, itemName } ─
function parseItemInput(raw) {
  // We can't reliably split without a known effect list, so we pass
  // the whole string as the item name for BPTF and STN
  return raw.trim();
}

// ── Quick lookup buttons ──────────────────────────────────────
const hint = document.getElementById('lookup-hint');

function getInputs() {
  const name    = document.getElementById('item-name').value.trim();
  const effId   = document.getElementById('effect-id').value.trim();
  const defIdx  = document.getElementById('def-index').value.trim();
  return { name, effId, defIdx };
}

document.getElementById('open-bptf').addEventListener('click', () => {
  const { name, effId } = getInputs();
  if (!name || !effId) { hint.textContent = 'Item name and Effect ID are required.'; return; }
  hint.textContent = '';
  chrome.tabs.create({ url: format2BPTF(name, effId) });
});

document.getElementById('open-stn').addEventListener('click', () => {
  const { name, effId } = getInputs();
  // STN uses effect name, not effect ID – we use the raw text as effect placeholder
  if (!name) { hint.textContent = 'Item name is required.'; return; }
  hint.textContent = '';
  // Split: first word(s) = effect (user should enter "Burning Flames" vs hat name via the fields)
  // For STN we need the effect name string; reuse effId field as a hint if blank
  const url = `https://stntrading.eu/item/tf2/Unusual%20${encodeURIComponent(effId || '')}%20${encodeURIComponent(name)}`;
  chrome.tabs.create({ url });
});

document.getElementById('open-mptf').addEventListener('click', () => {
  const { defIdx, effId } = getInputs();
  if (!defIdx || !effId) { hint.textContent = 'Def index and Effect ID are required.'; return; }
  hint.textContent = '';
  chrome.tabs.create({ url: format2MPTF(defIdx, effId) });
});

// ── Token storage ─────────────────────────────────────────────────

const tokenInput = document.getElementById('bptf-token');
const saveHint   = document.getElementById('save-hint');

// Load saved token into the input on popup open
chrome.storage.local.get('bptfToken', result => {
  if (result.bptfToken) {
    tokenInput.value = result.bptfToken;
    saveHint.textContent = 'Token loaded ✓';
    saveHint.style.color = '#4caf7d';
  }
});

document.getElementById('save-token').addEventListener('click', () => {
  const token = tokenInput.value.trim();
  if (!token) {
    chrome.storage.local.remove('bptfToken', () => {
      saveHint.textContent = 'Token cleared.';
      saveHint.style.color = '#e35d2f';
    });
    return;
  }
  chrome.storage.local.set({ bptfToken: token }, () => {
    saveHint.textContent = 'Token saved ✓';
    saveHint.style.color = '#4caf7d';
    setTimeout(() => { saveHint.textContent = ''; }, 3000);
  });
});
