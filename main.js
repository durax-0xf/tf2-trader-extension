// ==UserScript==
// @name         BPTF Multi-tool
// @namespace    http://tampermonkey.net/
// @version      4
// @description  QOL Features for TF2 trading!
// @author       durax
// @match        https://stntrading.eu/item/tf2/Unusual*
// @match        https://backpack.tf/*
// @match        https://steamcommunity.com/id/*/inventory/
// @match        https://steamcommunity.com/profiles/*/inventory/
// @match        https://scrap.tf/inventory
// @match        https://scrap.tf/auctions/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=backpack.tf
// @run-at       document-end
// @grant        none
// ==/UserScript==

function format2STN(name, effect, quality) {
    return `https://stntrading.eu/item/tf2/Unusual%20${effect}%20${encodeURI(name)}`;
}
function format2BPTF(name, effect, quality) {
    return `https://backpack.tf/stats/Unusual/${encodeURI(name)}/Tradable/Craftable/${effect}`;
}
function format2MPTF(defIndex, effId) {
    return `https://marketplace.tf/items/tf2/${defIndex};5;u${effId}`;
}

function createButton4STN() {
    //document.querySelector("#page-content > div.row > div > div.stats-body > div.stats-header > div.stats-header-item").childNodes[1].getAttribute("data-q_name")
    //can be used to get the quality of the item on bptf
    //defcat
    //can sometimes be used to get the quality of the item on stn
    function getBPTFLink(quality) {
        const effect_and_name = itemData.itemName.replace("Unusual ","");
        let target;
        document.querySelector("body > div.d-flex.flex-column > div.bg-dark > div.m-auto > div > div > div.col-sm-8.col-md-7.col-lg-8 > div.row.g-0 > div:nth-child(1) > div.row.g-0 > div.col-12 > div").childNodes.forEach(e => {
            if (e.style.color === "rgb(134, 80, 172)") {
                target = e.innerText.slice(18).replace("\n", " ");
                // unusual effect is always colored in rgb(134, 80, 172)
            }
        });
        const itemName = effect_and_name.replace(target, "");
        const effectId = document.querySelector("body > div.d-flex.flex-column > div.bg-dark > div.m-auto > div > div > div.col-sm-4.col-md-5.col-lg-4.p-3.h-100 > div > picture:nth-child(2) > source").srcset.split("/").at(-1).replace("@4x.webp", "");
        return format2BPTF(itemName, effectId);
    } // used to get the link to the item from stn to convert to bptf
    function displayButtonBPTF(){
        const div = document.querySelector("body > div.d-flex.flex-column > div.bg-dark > div.m-auto > div > div > div.col-sm-8.col-md-7.col-lg-8 > div.row.g-0 > div:nth-child(1) > div.px-3.px-sm-0.pb-2.d-flex.justify-content-between.justify-content-sm-start");

        const btn = document.createElement('a');
        btn.id = "bptf-link";
        btn.className = "btn ms-sm-3 btn-secondary rounded-0";
        btn.innerText = "Open on BPTF";
        btn.href = getBPTFLink();
        btn.target = "_blank";

        const iconChild = document.createElement('img');
        iconChild.src = "https://external-content.duckduckgo.com/ip3/backpack.tf.ico";
        iconChild.style = "width: 18px; height: 18px; margin-right: 1px; display: inline-block;";

        btn.appendChild(iconChild);
        div.appendChild(btn);
    }

    displayButtonBPTF();
} // adds the button to open the item on bptf from stn as source

function createButton4BPTF() {
    function displayButtonWiki() {
        function wikiPages(node) {
            const container = node.childNodes[2].childNodes[3];
            const effectNameNode = Array.from(node.querySelectorAll('dd')).find(dd => dd.textContent.includes('Effect:'));
            if (effectNameNode) {
                const effectName = effectNameNode.textContent.slice(8).trim();

                let hatNode = container.lastChild;
                let unuNode = hatNode.cloneNode(true);

                if (hatNode && hatNode.childNodes[1]) {
                    hatNode.childNodes[1].textContent = " Hat Wiki";
                }
                if (unuNode && unuNode.childNodes[1]) {
                    unuNode.childNodes[1].textContent = " Effect Wiki";
                    unuNode.href = `https://wiki.teamfortress.com/wiki/${effectName}`;
                    unuNode.target = "_blank";
                    container.appendChild(unuNode);
                }
            }
        }
        //observer for popover
        const observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1 && node.matches('.popover[style*="display: block"]')) {
                wikiPages(node);
              }
            });
          });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function displayButtonSTN() {
        function getSTNLink() {
            const itemName = document.querySelector("#page-content > div.row > div > div.stats-body > div.stats-header > div.stats-header-item > div.item.q-440-5.q-440-border-5").dataset.base_name;
            const effectName = document.querySelector("#page-content > div.row > div > div.stats-body > div.stats-header > div.stats-header-item > div.item.q-440-5.q-440-border-5").dataset.effect_name;
            return format2STN(itemName, effectName);
        }

        const div = document.querySelector("#page-content > div.row > div > div.stats-body > div.stats-subheader > div.price-boxes");

        const btn = document.createElement('a');
        btn.className = "price-box";
        btn.target = "_blank";
        btn.href = getSTNLink();

        const iconChild = document.createElement('img');
        iconChild.src = "https://external-content.duckduckgo.com/ip3/stntrading.eu.ico";
        iconChild.style.cssText = "width: 32px; height: 32px;";

        const textWrapper = document.createElement('div');
        textWrapper.className = "text";
        textWrapper.innerHTML = `
            <div class="value">STN</div>
            <div class="subtitle">Open on STN</div>
        `;

        const iconWrapper = document.createElement('div');
        iconWrapper.className = "icon";
        iconWrapper.appendChild(iconChild);

        btn.appendChild(iconWrapper);
        btn.appendChild(textWrapper);
        div.appendChild(btn);
    }

    function displayButtonMPTF() {
        function getMPTFLink() {
            const defIndex = document.querySelector("#page-content > div.row > div > div.stats-body > div.stats-header > div.stats-header-item > div.item.q-440-5.q-440-border-5").attributes['data-defindex'].value;
            const effId = document.querySelector("#page-content > div.row > div > div.stats-body > div.stats-header > div.stats-header-item > div.item.q-440-5.q-440-border-5").attributes['data-effect_id'].value;
            return format2MPTF(defIndex, effId);
        }

        const priceBoxes = document.querySelector("#page-content > div.row > div > div.stats-body > div.stats-subheader > div.price-boxes");

        const priceBox = document.createElement("a");
        priceBox.className = "price-box";
        priceBox.setAttribute("data-tip", "top");
        priceBox.target = "_blank";
        priceBox.title = "Marketplace.tf";
        priceBox.href = getMPTFLink();

        const mptfImg = document.createElement("img");
        mptfImg.src = "/images/marketplace-medium.png?v=2";
        priceBox.appendChild(mptfImg);

        const textBox = document.createElement("div");
        textBox.className = "text";
        textBox.innerHTML = `
            <div class="value">MP.TF</div>
            <div class="subtitle">See past sales</div>
        `;

        priceBox.appendChild(textBox);
        priceBoxes.appendChild(priceBox);
    }

    displayButtonWiki();



    if (/^\/stats\/Unusual\/[^\/]+\/Tradable\/Craftable\/[^\/]+$/.test(window.location.pathname)) {
         displayButtonSTN();
        const priceBoxes = document.querySelector("#page-content > div.row > div > div.stats-body > div.stats-subheader > div.price-boxes").childNodes;
        const hasMarketplaceTF = Array.from(priceBoxes).some(nd => nd.className === "price-box" && nd.title === "Marketplace.tf");
        if (!hasMarketplaceTF) { // Only display the button if it doesn't exist
            displayButtonMPTF();
        }
    }
    //only display mptf and stn button on stats page


}
// adds:
// 1. a button to open the item on stn from bptf as source
// 2. a button to open the item on mptf from bptf as source
// 3. buttons to open effect wiki page and unusual wiki page

function createButton4SCRAPTF() {

    function selectAllSCRAPTF() {
        const itemCont = document.querySelector("#user-bp-440 > div").children;
        Array.from(itemCont).forEach(item => setTimeout(() => item.click()));
    }

    function createBptfLink() {
        const auctionItem = document.querySelector("#main-container > div > div.well.auction-well > div:nth-child(6) > div.auction-items > div > div");
        const hoverOver = document.querySelector(".hover-over");
        const dataElement = document.querySelector("#main-container div.auction-items div div");
        const data = dataElement ? [
            dataElement.dataset.title.replace(/<[^>]+>/g, "").trim(),
            dataElement.style.backgroundImage.match(/particles_440\/(\d+)_/)[1]
        ] : ["Not found", ""];

        auctionItem.addEventListener('mouseenter', () => {
            const cont = hoverOver.querySelector('.hover-over-content');
            if (hoverOver.style.display !== 'none' && !cont.querySelector('.btn-bptf')) {
                const bptfBtn = document.createElement('a');
                bptfBtn.href = format2BPTF(data[0], data[1]);
                bptfBtn.innerHTML = '<button class="btn btn-embossed btn-inverse btn-xs">Check on BPTF</button>';
                bptfBtn.target = "_blank";
                bptfBtn.classList.add('btn-bptf');
                cont.appendChild(bptfBtn);
            }
        });
    }

    createBptfLink();

    const btnCont = document.querySelector("#reverse-body > div.bp-txt");
    const wAll = document.createElement('button');
    wAll.className = "btn btn-embossed btn-primary btn-embossed btn-trade";
    wAll.innerText = "SELECT ALL Items";
    wAll.onclick = selectAllSCRAPTF;
    btnCont.appendChild(wAll);
}
// adds:
// 1. a button to select all items in scrap.tf inventory
// 2. a button to open the item on bptf from scrap.tf as source

function displayPure4Steam() {
    function createVisualCount(keys) {
        const part = document.querySelector("#tabcontent_inventory > div.filter_ctn.inventory_filters");
        const visual = document.createElement('div');
        visual.className = "hover_item_name";
        visual.innerText = `Total pure keys: ${keys}`;
        part.appendChild(visual);
    }
    async function pureCount() {
        if (!g_ActiveInventory) {
            console.error("No active inventory found.");
            return;
        }
        await g_ActiveInventory.LoadCompleteInventory(); // Ensure full inventory is loaded
        const keyCount = Object.values(g_ActiveInventory.m_rgAssets)
            .filter(item => item.description && item.description.market_hash_name === "Mann Co. Supply Crate Key")
            .length;
        return keyCount;
    }

    pureCount().then(keyCount => createVisualCount(keyCount));
}
// adds:
// 1. a visual count of pure keys in steam inventory

(function() {
    'use strict';
    if (window.location.hostname === 'stntrading.eu') {
        createButton4STN();
    } else if (window.location.hostname === 'backpack.tf') {
        window.onload = createButton4BPTF;
    } else if (window.location.hostname === 'scrap.tf') {
        createButton4SCRAPTF();
    } else if (/^https:\/\/steamcommunity\.com\/(id|profiles)\/([a-zA-Z0-9]+)\/inventory\/$/.test(window.location.href)) {
        window.onload = displayPure4Steam;
    }
})();