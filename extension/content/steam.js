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

// Cache for effects data
let effectsData = null;

async function fetchEffectsData() {
  if (effectsData) return effectsData;
  
  return new Promise((resolve, reject) => {
    const id = 'effects_' + Date.now();
    
    const resultListener = (e) => {
      if (e.detail.id !== id) return;
      document.removeEventListener('__generic_fetch_result', resultListener);
      
      if (e.detail.error) {
        reject(new Error(e.detail.error));
      } else {
        effectsData = e.detail.data;
        resolve(effectsData);
      }
    };
    
    document.addEventListener('__generic_fetch_result', resultListener);
    
    document.dispatchEvent(new CustomEvent('__generic_fetch_request', {
      detail: {
        id,
        url: 'https://raw.githubusercontent.com/danocmx/node-tf2-static-schema/refs/heads/master/static/effects.json'
      }
    }));
    
    // Timeout after 10 seconds
    setTimeout(() => {
      document.removeEventListener('__generic_fetch_result', resultListener);
      reject(new Error('Fetch timeout'));
    }, 10000);
  });
}

function addBPTFItemButton() {
  const rightPanel = document.querySelector("#active_inventory_page > div.inventory_page_right");
  if (!rightPanel) {
    setTimeout(addBPTFItemButton, 500);
    return;
  }

  const observer = new MutationObserver(async () => {
    const buttonContainer = [...document.querySelectorAll("#active_inventory_page a")].find(a => a.textContent.trim() === "Inspect in Game...")?.parentElement;
    if (!buttonContainer) return;

    // Avoid duplicates
    if (buttonContainer.querySelector('.bptf-item-btn')) return;

    // Extract item and effect info
    const infoList = rightPanel.innerText.split('\n');
    const effectLine = infoList.find((eff) => eff.includes("★ Unusual Effect:"));
    
    if (!effectLine) return; // Not an unusual item
    
    const effectName = effectLine.replace("★ Unusual Effect: ", "");
    
    // Check if item has been renamed
    const renamedLine = infoList.find((line) => line.includes("This item has been renamed"));
    let itemName;
    if (renamedLine) {
      // Extract original name from: 'This item has been renamed. Original name: "Pomade Prince"'
      const match = renamedLine.match(/Original name: "(.+?)"/);
      itemName = match ? match[1] : infoList[0].replace("Unusual ", "");
    } else {
      itemName = infoList[0].replace("Unusual ", "");
    }

    // Fetch effects data and find effect ID
    let effects;
    try {
      effects = await fetchEffectsData();
    } catch (e) {
      return;
    }
    
    if (!effects) return;

    const effectEntry = Object.entries(effects).find(([id, name]) => name === effectName);
    if (!effectEntry) return;

    const effectId = effectEntry[0];

    // Create the button
    const bptfButton = document.createElement('a');
    bptfButton.className = 'bptf-item-btn';
    bptfButton.href = `https://backpack.tf/stats/Unusual/${encodeURIComponent(itemName)}/Tradable/Craftable/${effectId}`;
    bptfButton.target = '_blank';
    bptfButton.style.cssText = `
      background: linear-gradient(135deg, #697da4 0%, #3a5280 100%) !important;
      border: 1px solid #5c7ab8 !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-weight: 600 !important;
      transition: all 0.2s ease !important;
      margin-top: 8px !important;
      width: 100% !important;
      padding: 8px !important;
      text-decoration: none !important;
      color: #c6d4df !important;
      border-radius: 2px !important;
      cursor: pointer !important;
    `;

    const logo = document.createElement('img');
    logo.src = 'https://icons.duckduckgo.com/ip3/backpack.tf.ico';
    logo.style.cssText = 'width:16px;height:16px;vertical-align:middle;margin-right:5px;';

    bptfButton.appendChild(logo);
    bptfButton.appendChild(document.createTextNode('View on BPTF'));

    buttonContainer.appendChild(bptfButton);
  });

  observer.observe(rightPanel, { childList: true, subtree: true });
}

function addBPTFProfileButton() {
  if (typeof g_rgProfileData === 'undefined' || !g_rgProfileData.steamid) {
    setTimeout(addBPTFProfileButton, 500);
    return;
  }

  const buttonsDiv = document.querySelector("div.profile_header_actions");
  if (!buttonsDiv) {
    setTimeout(addBPTFProfileButton, 500);
    return;
  }

  // Avoid duplicates
  if (buttonsDiv.querySelector('.bptf-profile-btn')) return;

  const bptfButton = document.createElement('a');
  bptfButton.className = 'btn_profile_action btn_medium bptf-profile-btn';
  bptfButton.href = `https://backpack.tf/profiles/${g_rgProfileData.steamid}`;
  bptfButton.target = '_blank';
  bptfButton.style.cssText = `
    background: linear-gradient(135deg, #697da4 0%, #3a5280 100%) !important;
    border: 1px solid #5c7ab8 !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-weight: 600 !important;
    transition: all 0.2s ease !important;
    margin-top: 8px !important;
    width: 100% !important;
  `;
  
  
  const logo = document.createElement('img');
  logo.src = 'https://icons.duckduckgo.com/ip3/backpack.tf.ico';
  logo.style.cssText = 'width:16px;height:16px;vertical-align:middle;margin-right:5px;';
  
  bptfButton.appendChild(logo);
  bptfButton.appendChild(document.createTextNode('Open On BPTF'));
  
  buttonsDiv.appendChild(bptfButton);
}

function init() {
  const isInventoryPage = window.location.pathname.includes('/inventory');
  const isProfilePage = /^\/(id|profiles)\/[^\/]+\/?$/.test(window.location.pathname);

  if (isInventoryPage) {
    pureCount();
    addBPTFItemButton();
  }
  
  if (isProfilePage) {
    addBPTFProfileButton();
  }
}

window.addEventListener('load', init);
