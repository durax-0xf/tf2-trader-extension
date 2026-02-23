/**
 * bptf.js — backpack.tf content script.
 * Adds:
 *   1. "Open on STN" price box
 *   2. "MP.TF" price box (if not already present)
 *   3. "Previous Effect" / "Next Effect" breadcrumb links
 *   4. Effect Wiki link in the item info popover
 */
'use strict';

// ── Helpers ───────────────────────────────────────────────────

function getItemEl() {
  return document.querySelector(
    '#page-content > div.row > div > div.stats-body > div.stats-header ' +
    '> div.stats-header-item > div.item.q-440-5.q-440-border-5'
  );
}

// ── STN button ────────────────────────────────────────────────

function displayButtonSTN() {
  const itemEl = getItemEl();
  if (!itemEl) return;

  const itemName   = itemEl.dataset.base_name;
  const effectName = itemEl.dataset.effect_name;
  const priceBoxes = document.querySelector(
    '#page-content > div.row > div > div.stats-body > div.stats-subheader > div.price-boxes'
  );
  if (!priceBoxes) return;

  // Avoid duplicates
  if (priceBoxes.querySelector('.bptf-multitool-stn')) return;

  const btn = document.createElement('a');
  btn.className  = 'price-box bptf-multitool-stn';
  btn.target     = '_blank';
  btn.href       = format2STN(itemName, effectName);
  btn.title      = 'stntrading.eu';

  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'icon';
  const img = document.createElement('img');
  img.src            = 'https://external-content.duckduckgo.com/ip3/stntrading.eu.ico';
  img.style.cssText  = 'width:32px;height:32px;';
  iconWrapper.appendChild(img);

  const textWrapper = document.createElement('div');
  textWrapper.className = 'text';
  textWrapper.innerHTML = '<div class="value">STN</div><div class="subtitle">Open on STN</div>';

  btn.appendChild(iconWrapper);
  btn.appendChild(textWrapper);
  priceBoxes.appendChild(btn);
}

// ── MPTF button ───────────────────────────────────────────────

function displayButtonMPTF() {
  const itemEl = getItemEl();
  if (!itemEl) return;

  const defIndex = itemEl.getAttribute('data-defindex');
  const effId    = itemEl.getAttribute('data-effect_id');
  const priceBoxes = document.querySelector(
    '#page-content > div.row > div > div.stats-body > div.stats-subheader > div.price-boxes'
  );
  if (!priceBoxes) return;

  // Only add if marketplace.tf box is absent
  const already = Array.from(priceBoxes.querySelectorAll('.price-box'))
    .some(el => el.title === 'Marketplace.tf');
  if (already) return;

  const priceBox = document.createElement('a');
  priceBox.className = 'price-box';
  priceBox.setAttribute('data-tip', 'top');
  priceBox.target = '_blank';
  priceBox.title  = 'Marketplace.tf';
  priceBox.href   = format2MPTF(defIndex, effId);

  const mptfImg = document.createElement('img');
  mptfImg.src = '/images/marketplace-medium.png?v=2';
  priceBox.appendChild(mptfImg);

  const textBox = document.createElement('div');
  textBox.className = 'text';
  textBox.innerHTML = '<div class="value">MP.TF</div><div class="subtitle">See past sales</div>';
  priceBox.appendChild(textBox);

  priceBoxes.appendChild(priceBox);
}

// ── Prev/Next effect buttons ───────────────────────────────────

function displayButtonsPrevNext() {
  const root = document.querySelector(
    '#page-content > div.row > div > div.stats-breadcrumbs'
  );
  if (!root) return;

  const og = root.querySelector('a:nth-child(2)');
  if (!og) return;

  // Avoid duplicates
  if (root.querySelector('.bptf-multitool-nav')) return;

  const parts    = window.location.href.split('/');
  const ogEffID  = Number(parts[8]);

  const createNavLink = (text, offset) => {
    const link = og.cloneNode(false);
    const newParts = [...parts];
    newParts[8] = ogEffID + offset;
    link.href      = newParts.join('/');
    link.innerText = text;
    link.className += ' bptf-multitool-nav';
    return link;
  };

  root.appendChild(createNavLink('🠜 Previous Effect', -1));
  root.appendChild(createNavLink('Next Effect 🠞', 1));
}

// ── Effect wiki link in popover ────────────────────────────────

function displayButtonWiki() {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (
          node.nodeType === 1 &&
          node.matches('.popover[style*="display: block"]')
        ) {
          addWikiLink(node);
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function addWikiLink(node) {
  const container = node.childNodes[2]?.childNodes[3];
  if (!container) return;

  const effectNameNode = Array.from(node.querySelectorAll('dd'))
    .find(dd => dd.textContent.includes('Effect:'));
  if (!effectNameNode) return;

  const effectName = effectNameNode.textContent.slice(8).trim();
  const hatNode    = container.lastChild;
  if (!hatNode) return;

  // Avoid duplicates
  if (container.querySelector('.bptf-multitool-wiki-effect')) return;

  // Rename hat link
  if (hatNode.childNodes[1]) {
    hatNode.childNodes[1].textContent = ' Hat Wiki';
  }

  const unuNode = hatNode.cloneNode(true);
  if (unuNode.childNodes[1]) {
    unuNode.childNodes[1].textContent = ' Effect Wiki';
  }
  unuNode.href      = `https://wiki.teamfortress.com/wiki/${encodeURIComponent(effectName)}`;
  unuNode.target    = '_blank';
  unuNode.className += ' bptf-multitool-wiki-effect';
  container.appendChild(unuNode);
}

// ── Entry point ───────────────────────────────────────────────

function init() {
  // Wiki observer runs everywhere on backpack.tf
  displayButtonWiki();

  // Unusual stats page
  if (/^\/stats\/Unusual\/[^\/]+\/Tradable\/Craftable\/[^\/]+$/.test(window.location.pathname)) {
    displayButtonSTN();
    displayButtonMPTF();
    displayButtonsPrevNext();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('load', init);
} else {
  // Already loaded – run after a short tick to let bptf's own JS finish
  window.addEventListener('load', init);
}
