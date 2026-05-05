import WatchLaterPopup from "./watchLaterPopup.js";
import WatchList from "./watchList.js";
import Utils from "./utils.js";
// ==UserScript==
// @name         My Watch Later
// @namespace    http://www.mikesbytes.net/userscripts
// @version      1.1.2
// @description  A YouTube Watch Later feature that you own
// @author       Michael Moreno
// @homepageURL  https://greasyfork.org/en/scripts/576490-my-watch-later
// @match        https://www.youtube.com/*
// @match        https://www.youtube.com/watch*
// @grant        GM.getValue
// @grant        GM.setValue
// @license      GPL-3.0
// ==/UserScript==

/* eslint-disable no-unused-vars */
const UserScriptName = "My Watch Later";
const UserScriptVersion = "1.1.0";
/* eslint-enable no-unused-vars */

let buttonSet = new Set();

// eslint-disable-next-line no-unused-vars
async function main() {
  document.addEventListener("yt-navigate-finish", () => {
    const addToWatchlistBtn = document.createElement("button");

    addToWatchlistBtn.innerText = "Add to My Watch Later";
    addToWatchlistBtn.id = "addVideoToWatchlist";

    addToWatchlistBtn.addEventListener("click", WatchList.addToWatchlistAsync);

    const logoElement = document.getElementById("logo");

    if (!buttonSet.has("addToWatchlistBtn")) {
      logoElement.parentNode.insertBefore(
        addToWatchlistBtn,
        logoElement.nextSibling,
      );

      buttonSet.add("addToWatchlistBtn");
    }

    const addedButton = document.getElementById("addVideoToWatchlist");

    const openWatchLaterBtn = document.createElement("button");

    openWatchLaterBtn.innerText = "Open My Watch Later";

    openWatchLaterBtn.addEventListener(
      "click",
      WatchLaterPopup.openWatchLaterAsync,
    );

    if (!buttonSet.has("openWatchLaterBtn")) {
      addedButton.parentNode.insertBefore(
        openWatchLaterBtn,
        addedButton.nextSibling,
      );

      buttonSet.add("openWatchLaterBtn");
    }

    if (Utils.isVideoUrl(window.location.href)) {
      Utils.showButton("addVideoToWatchlist");
    } else {
      Utils.hideButton("addVideoToWatchlist");
    }
  });
}
