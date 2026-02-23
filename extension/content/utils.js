/**
 * utils.js — shared URL helpers injected before every site-specific content script.
 */
'use strict';

function format2STN(name, effect) {
  return `https://stntrading.eu/item/tf2/Unusual%20${encodeURIComponent(effect)}%20${encodeURIComponent(name)}`;
}

function format2BPTF(name, effectId) {
  return `https://backpack.tf/stats/Unusual/${encodeURIComponent(name)}/Tradable/Craftable/${effectId}`;
}

function format2MPTF(defIndex, effId) {
  return `https://marketplace.tf/items/tf2/${defIndex};5;u${effId}`;
}
