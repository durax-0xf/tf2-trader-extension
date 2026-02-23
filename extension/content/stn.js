/**
 * stn.js — stntrading.eu content script.
 * Adds an "Open on BPTF" button on Unusual item pages.
 */
'use strict';

// ── Token (injected by token-bridge.js via CustomEvent) ───────
// Stored here so any future fetch helper can read window.__bptfToken.
window.__bptfToken = window.__bptfToken || '';
document.addEventListener('__bptf_token_ready', e => {
  window.__bptfToken = e.detail.token || '';
}, { once: true });

/**
 * getPageItem()
 * Extracts the current item's data from the STN page.
 * @returns {{ name: string, effectName: string, effectId: string, quality: number }}
 */
function getPageItem() {
  // Effect ID from the particle source image
  const particleSrc = document.querySelector(
    'body > div.d-flex.flex-column > div.bg-dark > div.m-auto > div > div ' +
    '> div.col-sm-4.col-md-5.col-lg-4.p-3.h-100 > div > picture:nth-child(2) > source'
  );
  const effectId = particleSrc
    ? particleSrc.srcset.split('/').at(-1).replace('@4x.webp', '')
    : '';

  // Effect name from the purple-coloured description node
  let effectName = '';
  document.querySelectorAll(
    'body > div.d-flex.flex-column > div.bg-dark > div.m-auto > div > div ' +
    '> div.col-sm-8.col-md-7.col-lg-8 > div.row.g-0 > div:nth-child(1) ' +
    '> div.row.g-0 > div.col-12 > div *'
  ).forEach(node => {
    if (node.style && node.style.color === 'rgb(134, 80, 172)') {
      effectName = node.innerText.slice(18).replace('\n', ' ').trim();
    }
  });

  // Item name — prefer STN's own itemData JS object (available in world: MAIN)
  let name = '';
  if (typeof itemData !== 'undefined' && itemData.itemName) {
    name = itemData.itemName
      .replace('Unusual ', '')
      .replace(effectName, '')
      .trim();
  } else {
    // Fallback: decode from the URL segment
    const raw = decodeURIComponent(window.location.pathname.split('/').pop());
    name = raw.replace(/^Unusual\s+/i, '').replace(effectName, '').trim();
  }

  // Unusuals are always quality 5; kept explicit for future non-unusual support
  const quality = 5;

  return { name, effectName, effectId, quality };
}

/**
 * getBPTFLink()
 * Formats the backpack.tf stats URL for the current page item.
 * @returns {string}
 */
function getBPTFLink() {
  const { name, effectId } = getPageItem();
  return format2BPTF(name, effectId);
}

function injectSTNStyles() {
  if (document.getElementById('bptf-multitool-stn-styles')) return;
  const style = document.createElement('style');
  style.id = 'bptf-multitool-stn-styles';
  style.textContent = `
    /* ── Shared button base ───────────────────────────────── */
    .bptf-mt-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: .03em;
      cursor: pointer;
      text-decoration: none;
      transition: background .18s, transform .12s, box-shadow .18s;
      user-select: none;
      white-space: nowrap;
    }
    .bptf-mt-btn:active { transform: scale(.96); }

    /* ── BPTF open button ─────────────────────────────────── */
    #bptf-link.bptf-mt-btn {
      background: #3a7bd5;
      color: #fff;
      box-shadow: 0 2px 8px rgba(58,123,213,.35);
    }
    #bptf-link.bptf-mt-btn:hover {
      background: #2f68bb;
      box-shadow: 0 4px 14px rgba(58,123,213,.5);
      color: #fff;
    }
    #bptf-link.bptf-mt-btn img {
      width: 15px;
      height: 15px;
      flex-shrink: 0;
    }

    /* ── MCO open button ──────────────────────────────────── */
    #mco-link.bptf-mt-btn {
      background: #1a6e3c;
      color: #fff;
      box-shadow: 0 2px 8px rgba(26,110,60,.35);
    }
    #mco-link.bptf-mt-btn:hover {
      background: #155c31;
      box-shadow: 0 4px 14px rgba(26,110,60,.5);
      color: #fff;
    }
    #mco-link.bptf-mt-btn img {
      width: 15px;
      height: 15px;
      flex-shrink: 0;
    }

    /* ── Reprice button ───────────────────────────────────── */
    #request_reprice.bptf-mt-btn {
      background: #2a2a3d;
      color: #a0b0d0;
      border: 1px solid #3a3a55;
      box-shadow: 0 1px 4px rgba(0,0,0,.4);
    }
    #request_reprice.bptf-mt-btn:hover {
      background: #33334d;
      color: #d0e0ff;
      border-color: #5566aa;
    }

    /* ── Wishlist add button ────────────────────────────────── */
    #wishlist_add.bptf-mt-btn {
      background: #2a2a3d;
      color: #c07080;
      border: 1px solid #3a3a55;
      box-shadow: 0 1px 4px rgba(0,0,0,.4);
    }
    #wishlist_add.bptf-mt-btn:hover {
      background: #3d2a35;
      color: #ff8099;
      border-color: #884455;
    }

    /* ── Wishlist remove button ──────────────────────────────── */
    #wishlist_remove.bptf-mt-btn {
      background: #3d1f25;
      color: #e05060;
      border: 1px solid #5a2530;
      box-shadow: 0 1px 4px rgba(0,0,0,.4);
    }
    #wishlist_remove.bptf-mt-btn:hover {
      background: #541e28;
      color: #ff6070;
      border-color: #882233;
      box-shadow: 0 2px 8px rgba(224,80,96,.3);
    }

    /* ── Sell block container ────────────────────────────────── */
    .bptf-sell-block {
      background: #13131f;
      border: 1px solid #1e1e33;
      border-radius: 10px;
      padding: 14px 16px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      text-align: center;
    }
    .bptf-sell-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: #556;
      margin: 0;
    }
    .bptf-sell-price-keys {
      font-size: 22px;
      font-weight: 800;
      color: #f5d26b;
      line-height: 1.1;
      margin: 0;
    }
    .bptf-sell-price-ref {
      font-size: 12px;
      color: #888;
      margin: 0 0 2px;
    }
    .bptf-sell-stock {
      font-size: 11px;
      color: #4caf7d;
      margin: 0;
    }
    .bptf-sell-stock.out-of-stock {
      color: #e05060;
    }
    /* Sell button */
    button.bptf-sell-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      margin-top: 4px;
      padding: 7px 22px;
      background: linear-gradient(135deg, #1e7a3e, #27a354);
      color: #fff;
      border: none;
      border-radius: 7px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: .04em;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(39,163,84,.35);
      transition: background .18s, box-shadow .18s, transform .1s;
    }
    button.bptf-sell-btn:hover {
      background: linear-gradient(135deg, #25964c, #30c065);
      box-shadow: 0 4px 16px rgba(39,163,84,.5);
    }
    button.bptf-sell-btn:active { transform: scale(.96); }
    button.bptf-sell-btn:disabled {
      background: #2a2a2a;
      color: #555;
      box-shadow: none;
      cursor: not-allowed;
    }

    /* ── Action cards row (Sellers list / Lowest price) ─────────── */
    .bptf-action-row {
      display: flex;
      gap: 8px;
      width: 100%;
      margin-top: 8px;
      align-items: stretch;
    }
    .bptf-action-card {
      flex: 1 1 0;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      background: #1a1a2e;
      border: 1px solid #25253a;
      border-radius: 8px;
      cursor: default;
      user-select: none;
      min-width: 0;
      overflow: hidden;
    }
    .bptf-action-card i {
      flex-shrink: 0;
      font-size: 13px;
      color: #5577cc;
    }
    .bptf-card-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
      flex: 1;
    }
    .bptf-card-label {
      font-size: 10px;
      font-weight: 600;
      color: #556;
      text-transform: uppercase;
      letter-spacing: .05em;
      white-space: nowrap;
    }
    .bptf-card-val {
      font-size: 11px;
      font-weight: 700;
      color: #a0b0d0;
      line-height: 1.3;
      word-break: break-word;
      overflow-wrap: break-word;
    }
    .bptf-card-ref {
      font-size: 9.5px;
      color: #778899;
      font-weight: 600;
    }

    /* ── Buy block extras ───────────────────────────────────────── */
    .bptf-buy-stock {
      font-size: 11px;
      color: #e05060;
      margin: 0;
    }
    .bptf-buy-stock.in-stock {
      color: #4caf7d;
    }
    /* QuickBuy row */
    .bptf-quickbuy-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
    }
    select.bptf-buy-select {
      flex: 1;
      padding: 6px 8px;
      background: #1a1a2e;
      color: #c8d6f0;
      border: 1px solid #2a2a42;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      outline: none;
      cursor: pointer;
      appearance: auto;
    }
    select.bptf-buy-select:disabled {
      color: #444;
      cursor: not-allowed;
      border-color: #1e1e30;
    }
    button.bptf-buy-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 14px;
      background: linear-gradient(135deg, #b07a10, #d4a017);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(212,160,23,.3);
      transition: background .18s, transform .1s, box-shadow .18s;
    }
    button.bptf-buy-btn:hover {
      background: linear-gradient(135deg, #c98d12, #f0b820);
      box-shadow: 0 4px 12px rgba(212,160,23,.5);
    }
    button.bptf-buy-btn:active { transform: scale(.96); }
    button.bptf-buy-btn:disabled {
      background: #2a2a2a;
      color: #555;
      box-shadow: none;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);
}

// ── BPTF Snapshot fetch ───────────────────────────────────────────────────────

/**
 * fetchBPTFSnapshot(sku)
 * Routes through fetch-bridge.js (isolated world) to avoid CORS/chrome-API
 * restrictions inside world: MAIN.  Returns { buy, sell } sorted by price,
 * or null on failure.
 * @param {string} sku  e.g. "Molten Mallard Magistrate's Mullet"
 * @returns {Promise<{buy: object[], sell: object[]}|null>}
 */
function fetchBPTFSnapshot(sku) {
  return new Promise(resolve => {
    const id = `bptf_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const handler = e => {
      if (e.detail?.id !== id) return;
      document.removeEventListener('__bptf_fetch_result', handler);

      if (e.detail.error || !e.detail.data) {
        console.error('[bptf-multitool] fetchBPTFSnapshot error:', e.detail.error);
        return resolve(null);
      }

      // A listing requiring a spelled item has defindex 1005 in its attributes
      const isSpelled = l => Array.isArray(l.item?.attributes) &&
        l.item.attributes.some(a => Number(a.defindex) === 1005);

      // USD-only = marketplace.tf bot listing, not a peer-to-peer trade
      const isUsdOnly = l => !!(l.currencies?.usd && !l.currencies?.keys && !l.currencies?.metal);

      const listings = Array.isArray(e.detail.data.listings) ? e.detail.data.listings : [];

      // Buy: exclude spelled requirements, sort highest price first
      const buy  = listings
        .filter(l => l.intent === 'buy' && !isSpelled(l))
        .sort((a, b) => b.price - a.price);

      // Sell: sort cheapest first
      const sell = listings
        .filter(l => l.intent === 'sell')
        .sort((a, b) => a.price - b.price);

      // Pick the best values, preferring key/ref over USD-only
      const bestBuy = buy .find(l => !isUsdOnly(l)) ?? buy[0]  ?? null;
      const topSell = sell.find(l => !isUsdOnly(l)) ?? sell[0] ?? null;

      resolve({ buy, sell, bestBuy, topSell });
    };

    document.addEventListener('__bptf_fetch_result', handler);
    document.dispatchEvent(new CustomEvent('__bptf_fetch_request', { detail: { id, sku } }));
  });
}

/**
 * Formats a BPTF currencies object into a readable string.
 * @param {{ keys?: number, metal?: number }} c
 */
function formatCurrencies(c) {
  const parts = [];
  if (c.keys)  parts.push(`${c.keys} keys`);
  if (c.metal) parts.push(`${c.metal} ref`);
  if (c.usd)   parts.push(`$${c.usd.toFixed(2)}`);
  return parts.length ? parts.join(', ') : '—';
}

function styleSellBlock() {
  // Find the sell container by its label text — works whether the button is enabled or disabled
  // (disabled buttons lose their onclick attribute, so we can't query by that)
  const allCenters = document.querySelectorAll('.text-center');
  let container = null;
  for (const el of allCenters) {
    if (el.querySelector('p') && el.textContent.includes('Sell it for')) {
      container = el;
      break;
    }
  }
  if (!container || container.dataset.bptfStyled) return;
  container.dataset.bptfStyled = '1';
  container.classList.add('bptf-sell-block');

  const sellBtn = container.querySelector('button.btn-success');
  // Restyle existing paragraphs
  const paras = container.querySelectorAll('p');
  paras.forEach(p => {
    if (p.textContent.includes('Sell it for')) {
      p.className = 'bptf-sell-label';
      p.removeAttribute('style');
      p.textContent = 'Sell it for';
    } else if (p.classList.contains('text-success') || p.classList.contains('text-danger')) {
      // Stock line — text-success when stock > 0, text-danger when 0
      const wasRed = p.classList.contains('text-danger');
      p.className = 'bptf-sell-stock' + (wasRed ? ' out-of-stock' : '');
    } else {
      // Price paragraph
      const raw = p.textContent.trim(); // e.g. "371 keys, 48.88 ref"
      const keyMatch = raw.match(/(\d[\d,.]*)\s*keys?/i);
      const refMatch = raw.match(/([\d,.]+)\s*ref/i);
      p.removeAttribute('style');
      p.innerHTML = '';
      if (keyMatch) {
        const kEl = document.createElement('span');
        kEl.className = 'bptf-sell-price-keys';
        kEl.textContent = keyMatch[1] + ' keys ';
        p.appendChild(kEl);
      }
      if (refMatch) {
        const rEl = document.createElement('span');
        rEl.className = 'bptf-sell-price-ref';
        rEl.textContent = refMatch[1] + ' ref';
        p.appendChild(rEl);
      }
      p.className = '';
    }
  });

  // Restyle sell button
  if (sellBtn) {
    sellBtn.className = 'bptf-sell-btn';
    sellBtn.innerHTML = 'Sell <i class="far fa-money-bill-alt"></i>';
  }

  // Build links via shared getPageItem()
  const { name: baseName, effectId, effectName } = getPageItem();

  let sellersHref = 'https://backpack.tf';
  let lowestHref  = 'https://marketplace.tf';

  if (baseName) {
    sellersHref = `https://backpack.tf/classifieds?item=${encodeURIComponent(baseName)}&quality=5&tradable=1&craftable=1&australium=-1&particle=${effectId}`;
  }
  if (typeof itemData !== 'undefined' && itemData.defindex) {
    lowestHref = format2MPTF(itemData.defindex, effectId);
  }

  // Action cards row
  const row = document.createElement('div');
  row.className = 'bptf-action-row';

  const makeCard = (icon, label) => {
    const d = document.createElement('div');
    d.className = 'bptf-action-card';
    d.innerHTML = `<i class="${icon}"></i><div class="bptf-card-text"><span class="bptf-card-label">${label}</span><span class="bptf-card-val">…</span></div>`;
    return d;
  };

  const buyCountCard = makeCard('fas fa-users', 'Buyers');
  const bestBuyCard  = makeCard('fas fa-coins', 'Top Buy');
  row.appendChild(buyCountCard);
  row.appendChild(bestBuyCard);
  container.appendChild(row);

  // Async: populate from BPTF snapshot
  if (effectName && baseName) {
    fetchBPTFSnapshot(`${effectName} ${baseName}`).then(snapshot => {
      if (!snapshot) return;
      const count  = snapshot.buy.length;
      buyCountCard.querySelector('.bptf-card-val').textContent = `${count} Buyer${count !== 1 ? 's' : ''}`;
      if (snapshot.bestBuy) {
        const parts = formatCurrencies(snapshot.bestBuy.currencies).split(', ');
        bestBuyCard.querySelector('.bptf-card-val').innerHTML = parts
          .map(p => /ref$/i.test(p) ? `<span class="bptf-card-ref">${p}</span>` : p)
          .join('<br>');
      }
    });
  }
}

function styleBuyBlock() {
  const buyContainer = document.querySelector(
    'body > div.d-flex.flex-column > div.bg-dark > div.m-auto > div > div ' +
    '> div.col-sm-8.col-md-7.col-lg-8 > div.row.g-0 > div:nth-child(1) ' +
    '> div.row.g-0 > div:nth-child(3) > div > div.text-center'
  );
  if (!buyContainer || buyContainer.dataset.bptfStyled) return;
  buyContainer.dataset.bptfStyled = '1';
  buyContainer.classList.add('bptf-sell-block');

  // Restyle paragraphs
  const paras = buyContainer.querySelectorAll('p');
  paras.forEach(p => {
    if (p.textContent.includes('Buy it for')) {
      p.className = 'bptf-sell-label';
      p.removeAttribute('style');
      p.textContent = 'Buy it for';
    } else if (p.classList.contains('text-danger') || p.classList.contains('text-success')) {
      // Stock line — text-danger when 0, text-success when available
      const qty = p.querySelector('b') ? p.querySelector('b').textContent.trim() : '0';
      const num = parseInt(qty, 10);
      p.className = 'bptf-buy-stock' + (num > 0 ? ' in-stock' : '');
      p.innerHTML = `<b>${qty}</b> in Stock`;
    } else {
      // Price paragraph
      const raw = p.textContent.trim();
      const keyMatch = raw.match(/(\d[\d,.]*)\s*keys?/i);
      const refMatch = raw.match(/([\d,.]+)\s*ref/i);
      p.removeAttribute('style');
      p.innerHTML = '';
      if (keyMatch) {
        const kEl = document.createElement('span');
        kEl.className = 'bptf-sell-price-keys';
        kEl.textContent = keyMatch[1] + ' keys ';
        p.appendChild(kEl);
      }
      if (refMatch) {
        const rEl = document.createElement('span');
        rEl.className = 'bptf-sell-price-ref';
        rEl.textContent = refMatch[1] + ' ref';
        p.appendChild(rEl);
      }
      p.className = '';
    }
  });

  // Restyle QuickBuy input group
  const inputGroup = buyContainer.querySelector('.input-group');
  if (inputGroup) {
    inputGroup.removeAttribute('style');
    inputGroup.className = 'bptf-quickbuy-row';

    const sel = inputGroup.querySelector('#quickBuySelect');
    if (sel) {
      sel.className = 'bptf-buy-select';
      sel.removeAttribute('style');
    }

    const boltBtn = inputGroup.querySelector('button');
    if (boltBtn) {
      boltBtn.className = 'bptf-buy-btn';
      boltBtn.removeAttribute('data-bs-toggle');
      boltBtn.removeAttribute('data-bs-placement');
      boltBtn.innerHTML = '<i class="fas fa-bolt"></i>';
    }

    // Move the input group out of its centering wrapper directly into the block
    buyContainer.appendChild(inputGroup);
    const wrapper = buyContainer.querySelector('.d-flex.justify-content-center');
    if (wrapper && !wrapper.children.length) wrapper.remove();
  }

  // Build action card hrefs via shared getPageItem()
  const { name: baseName, effectId, effectName } = getPageItem();

  let buyersHref    = 'https://backpack.tf';
  let priceHistHref = 'https://backpack.tf';

  if (baseName) {
    buyersHref    = `https://backpack.tf/classifieds?item=${encodeURIComponent(baseName)}&quality=5&tradable=1&craftable=1&australium=-1&particle=${effectId}&intent=buy`;
    priceHistHref = format2BPTF(baseName, effectId);
  }

  const row = document.createElement('div');
  row.className = 'bptf-action-row';

  const makeCard = (icon, label) => {
    const d = document.createElement('div');
    d.className = 'bptf-action-card';
    d.innerHTML = `<i class="${icon}"></i><div class="bptf-card-text"><span class="bptf-card-label">${label}</span><span class="bptf-card-val">…</span></div>`;
    return d;
  };

  const sellCountCard = makeCard('fas fa-store',     'Sellers');
  const highSellCard  = makeCard('fas fa-chart-bar', 'Cheapest');
  row.appendChild(sellCountCard);
  row.appendChild(highSellCard);
  buyContainer.appendChild(row);

  // Async: populate from BPTF snapshot
  if (effectName && baseName) {
    fetchBPTFSnapshot(`${effectName} ${baseName}`).then(snapshot => {
      if (!snapshot) return;
      const count   = snapshot.sell.length;
      sellCountCard.querySelector('.bptf-card-val').textContent = `${count} Seller${count !== 1 ? 's' : ''}`;
      if (snapshot.topSell) {
        const parts = formatCurrencies(snapshot.topSell.currencies).split(', ');
        highSellCard.querySelector('.bptf-card-val').innerHTML = parts
          .map(p => /ref$/i.test(p) ? `<span class="bptf-card-ref">${p}</span>` : p)
          .join('<br>');
      }
    });
  }
}

function styleSTN() {
  injectSTNStyles();

  const reprice        = document.querySelector('#request_reprice');
  const wishlistAdd    = document.querySelector('#wishlist_add');
  const wishlistRemove = document.querySelector('#wishlist_remove');

  if (reprice) {
    reprice.classList.add('bptf-mt-btn');
    reprice.innerHTML = '<i class="fas fa-search-dollar"></i><span>Reprice</span>';
  }
  if (wishlistAdd) {
    wishlistAdd.classList.add('bptf-mt-btn');
    wishlistAdd.innerHTML = '<i class="fas fa-heart"></i><span>Wishlist</span>';
  }
  if (wishlistRemove) {
    wishlistRemove.classList.add('bptf-mt-btn');
    wishlistRemove.innerHTML = '<i class="fas fa-heart-broken"></i><span>Remove</span>';
  }
}


function displayButtonBPTF() {
  injectSTNStyles();

  const div = document.querySelector(
    'body > div.d-flex.flex-column > div.bg-dark > div.m-auto > div > div ' +
    '> div.col-sm-8.col-md-7.col-lg-8 > div.row.g-0 > div:nth-child(1) ' +
    '> div.px-3.px-sm-0.pb-2.d-flex.justify-content-between.justify-content-sm-start'
  );
  if (!div) return;
  if (div.querySelector('#bptf-link')) return;

  const btn = document.createElement('a');
  btn.id        = 'bptf-link';
  btn.className = 'bptf-mt-btn ms-sm-2';
  btn.href      = getBPTFLink();
  btn.target    = '_blank';

  const icon = document.createElement('img');
  icon.src = 'https://external-content.duckduckgo.com/ip3/backpack.tf.ico';

  const label = document.createElement('span');
  label.textContent = 'Open on BPTF';

  btn.appendChild(icon);
  btn.appendChild(label);
  div.appendChild(btn);
}

function displayButtonMCO() {
  injectSTNStyles();
  const div = document.querySelector(
    'body > div.d-flex.flex-column > div.bg-dark > div.m-auto > div > div ' +
    '> div.col-sm-8.col-md-7.col-lg-8 > div.row.g-0 > div:nth-child(1) ' +
    '> div.px-3.px-sm-0.pb-2.d-flex.justify-content-between.justify-content-sm-start'
  );
  if (!div) return;
  if (div.querySelector('#mco-link')) return;

  function getMCOUrl() {
    const { name: baseName, effectName } = getPageItem(); // MCO uses "unusual" in the URL path instead of numeric quality
    return format2MCO(effectName, 'unusual', baseName);
  }

  const btn = document.createElement('a');
  btn.id        = 'mco-link';
  btn.className = 'bptf-mt-btn ms-sm-2';
  btn.href      = getMCOUrl();
  btn.target    = '_blank';

  const icon = document.createElement('img');
  icon.src = 'https://external-content.duckduckgo.com/ip3/mannco.store.ico';

  const label = document.createElement('span');
  label.textContent = 'Open on MCO';

  btn.appendChild(icon);
  btn.appendChild(label);
  div.appendChild(btn);
}

// Wait for the page to fully settle (STN is a SPA-ish page)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    displayButtonBPTF();
    displayButtonMCO();
    styleSTN();
    styleSellBlock();
    styleBuyBlock();
  });
} else {
  displayButtonBPTF();
  displayButtonMCO();
  styleSTN();
  styleSellBlock();
  styleBuyBlock();
}
