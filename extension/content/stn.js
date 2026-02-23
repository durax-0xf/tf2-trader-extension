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

function getBPTFLink() {
  // Effect ID from the particle source image — same method as the original userscript.
  const particleSrc = document.querySelector(
    'body > div.d-flex.flex-column > div.bg-dark > div.m-auto > div > div ' +
    '> div.col-sm-4.col-md-5.col-lg-4.p-3.h-100 > div > picture:nth-child(2) > source'
  );
  const effectId = particleSrc
    ? particleSrc.srcset.split('/').at(-1).replace('@4x.webp', '')
    : '';

  // Primary: use itemData.itemName exposed by STN's own page JS (requires world: MAIN).
  // This is exactly what the original userscript relied on.
  if (typeof itemData !== 'undefined' && itemData.itemName) {
    // itemData.itemName = "Unusual Burning Flames Team Captain"
    const effectAndName = itemData.itemName.replace('Unusual ', '');

    // Find the effect name from the purple-coloured node ("Unusual Effect: Burning Flames")
    let effectName = '';
    const descContainer = document.querySelector(
      'body > div.d-flex.flex-column > div.bg-dark > div.m-auto > div > div ' +
      '> div.col-sm-8.col-md-7.col-lg-8 > div.row.g-0 > div:nth-child(1) ' +
      '> div.row.g-0 > div.col-12 > div'
    );
    if (descContainer) {
      descContainer.childNodes.forEach(node => {
        if (node.style && node.style.color === 'rgb(134, 80, 172)') {
          // Original script used .slice(18) to strip "Unusual Effect: " (18 chars)
          effectName = node.innerText.slice(18).replace('\n', ' ').trim();
        }
      });
    }

    // Strip the effect name to get only the hat name, then pass to BPTF formatter.
    const itemName = effectName
      ? effectAndName.replace(effectName, '').trim()
      : effectAndName.trim();

    return format2BPTF(itemName, effectId);
  }

  // Fallback: parse from the URL. STN URLs are:
  // /item/tf2/Unusual%20<EffectName>%20<HatName>
  // We must strip both "Unusual " and the effect name to isolate the hat name.
  const rawSegment = window.location.pathname.split('/').pop();
  const decoded    = decodeURIComponent(rawSegment).replace(/^Unusual\s+/i, '');

  // Try DOM-based effect name extraction as the fallback splitter.
  let effectName = '';
  const descContainer = document.querySelector(
    'body > div.d-flex.flex-column > div.bg-dark > div.m-auto > div > div ' +
    '> div.col-sm-8.col-md-7.col-lg-8 > div.row.g-0 > div:nth-child(1) ' +
    '> div.row.g-0 > div.col-12 > div'
  );
  if (descContainer) {
    descContainer.childNodes.forEach(node => {
      if (node.style && node.style.color === 'rgb(134, 80, 172)') {
        effectName = node.innerText.slice(18).replace('\n', ' ').trim();
      }
    });
  }

  const itemName = effectName
    ? decoded.replace(effectName, '').trim()
    : decoded.trim();

  return format2BPTF(itemName, effectId);
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
    }
    .bptf-action-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 6px;
      background: #1a1a2e;
      border: 1px solid #25253a;
      border-radius: 8px;
      text-decoration: none;
      color: #a0b0d0;
      font-size: 11px;
      font-weight: 600;
      transition: background .18s, border-color .18s, color .18s;
    }
    .bptf-action-card:hover {
      background: #202038;
      border-color: #4466cc;
      color: #d0e0ff;
    }
    .bptf-action-card i {
      font-size: 15px;
      color: #5577cc;
      transition: color .18s;
    }
    .bptf-action-card:hover i { color: #7799ff; }

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

  // Build links from itemData (available via MAIN world)
  const effectId = (() => {
    const src = document.querySelector(
      'body > div.d-flex.flex-column > div.bg-dark > div.m-auto > div > div ' +
      '> div.col-sm-4.col-md-5.col-lg-4.p-3.h-100 > div > picture:nth-child(2) > source'
    );
    return src ? src.srcset.split('/').at(-1).replace('@4x.webp', '') : '';
  })();

  let sellersHref = 'https://backpack.tf';
  let lowestHref  = 'https://marketplace.tf';

  if (typeof itemData !== 'undefined' && itemData.itemName) {
    // Strip "Unusual <effectName> " to get bare hat name (e.g. "Anger")
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
    const baseName = itemData.itemName.replace('Unusual ', '').replace(effectName, '').trim();
    sellersHref = `https://backpack.tf/classifieds?item=${encodeURIComponent(baseName)}&quality=5&tradable=1&craftable=1&australium=-1&effect=${effectId}`;
    if (itemData.defindex) {
      lowestHref = format2MPTF(itemData.defindex, effectId);
    }
  }

  // Action cards row
  const row = document.createElement('div');
  row.className = 'bptf-action-row';

  const makeCard = (href, icon, label) => {
    const a = document.createElement('a');
    a.className = 'bptf-action-card';
    a.href      = href;
    a.target    = '_blank';
    a.innerHTML = `<i class="${icon}"></i><span>${label}</span>`;
    return a;
  };

  row.appendChild(makeCard(sellersHref, 'fas fa-list',       'Sellers list'));
  row.appendChild(makeCard(lowestHref,  'fas fa-tag',        'Lowest price'));
  container.appendChild(row);
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

  // Build action card hrefs
  const effectId = (() => {
    const src = document.querySelector(
      'body > div.d-flex.flex-column > div.bg-dark > div.m-auto > div > div ' +
      '> div.col-sm-4.col-md-5.col-lg-4.p-3.h-100 > div > picture:nth-child(2) > source'
    );
    return src ? src.srcset.split('/').at(-1).replace('@4x.webp', '') : '';
  })();

  let buyersHref   = 'https://backpack.tf';
  let priceHistHref = 'https://backpack.tf';

  if (typeof itemData !== 'undefined' && itemData.itemName) {
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
    const baseName = itemData.itemName.replace('Unusual ', '').replace(effectName, '').trim();
    buyersHref    = `https://backpack.tf/classifieds?item=${encodeURIComponent(baseName)}&quality=5&tradable=1&craftable=1&australium=-1&effect=${effectId}&intent=buy`;
    priceHistHref = format2BPTF(baseName, effectId);
  }

  const row = document.createElement('div');
  row.className = 'bptf-action-row';

  const makeCard = (href, icon, label) => {
    const a = document.createElement('a');
    a.className = 'bptf-action-card';
    a.href      = href;
    a.target    = '_blank';
    a.innerHTML = `<i class="${icon}"></i><span>${label}</span>`;
    return a;
  };

  row.appendChild(makeCard(buyersHref,    'fas fa-shopping-cart', 'Buyers list'));
  row.appendChild(makeCard(priceHistHref, 'fas fa-chart-line',    'Price history'));
  buyContainer.appendChild(row);
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

// Wait for the page to fully settle (STN is a SPA-ish page)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    displayButtonBPTF();
    styleSTN();
    styleSellBlock();
    styleBuyBlock();
  });
} else {
  displayButtonBPTF();
  styleSTN();
  styleSellBlock();
  styleBuyBlock();
}
