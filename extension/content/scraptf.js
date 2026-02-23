/**
 * scraptf.js — scrap.tf content script.
 * Adds:
 *   1. "SELECT ALL Items" button in the inventory section.
 *   2. A "Check on BPTF" hover button on auction item pages.
 */
'use strict';

// ── Select-all for inventory page (/inventory) ─────────────

function selectAllSCRAPTF() {
  const itemCont = document.querySelector('#user-bp-440 > div');
  if (!itemCont) return;
  Array.from(itemCont.children).forEach(item => setTimeout(() => item.click()));
}

function injectSelectAllButton() {
  const btnCont = document.querySelector('#reverse-body > div.bp-txt');
  if (!btnCont) return;
  if (btnCont.querySelector('.bptf-multitool-selectall')) return;

  const btn = document.createElement('button');
  btn.className = 'btn btn-embossed btn-primary btn-embossed btn-trade bptf-multitool-selectall';
  btn.innerText = 'SELECT ALL Items';
  btn.addEventListener('click', selectAllSCRAPTF);
  btnCont.appendChild(btn);
}

// ── BPTF hover link for auction pages (/auctions/*) ──────────

function injectBptfAuctionLink() {
  const auctionItem = document.querySelector(
    '#main-container > div > div.well.auction-well > div:nth-child(6) ' +
    '> div.auction-items > div > div'
  );
  const hoverOver   = document.querySelector('.hover-over');
  const dataElement = document.querySelector('#main-container div.auction-items div div');

  if (!auctionItem || !hoverOver || !dataElement) return;

  // Parse effect ID from background-image url (e.g. ".../particles_440/13_")
  const bgImg      = dataElement.style.backgroundImage || '';
  const effMatch   = bgImg.match(/particles_440\/(\d+)_/);
  const effectId   = effMatch ? effMatch[1] : '';
  const titleRaw   = (dataElement.dataset.title || '').replace(/<[^>]+>/g, '').trim();
  // Strip "Unusual <EffectName> " prefix to get just the item name — best effort
  const itemName   = titleRaw.replace(/^Unusual\s+/i, '');

  auctionItem.addEventListener('mouseenter', () => {
    const cont = hoverOver.querySelector('.hover-over-content');
    if (!cont) return;
    if (hoverOver.style.display === 'none') return;
    if (cont.querySelector('.bptf-multitool-bptf-btn')) return;

    const bptfBtn = document.createElement('a');
    bptfBtn.href      = format2BPTF(itemName, effectId);
    bptfBtn.innerHTML = '<button class="btn btn-embossed btn-inverse btn-xs">Check on BPTF</button>';
    bptfBtn.target    = '_blank';
    bptfBtn.className = 'bptf-multitool-bptf-btn';
    cont.appendChild(bptfBtn);
  });
}

// ── Entry point ───────────────────────────────────────────────

function init() {
  const path = window.location.pathname;
  if (path === '/inventory') {
    injectSelectAllButton();
  }
  if (/^\/auctions\//.test(path)) {
    injectBptfAuctionLink();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
