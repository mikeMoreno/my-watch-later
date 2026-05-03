import WatchLaterPopup from "./watchLaterPopup.js";
import WatchList from "./watchList.js";
import Utils from "./utils.js";
// ==UserScript==
// @name         My Watch Later
// @namespace    http://www.mikesbytes.net/userscripts
// @version      1.0.0
// @description  A YouTube Watch Later feature that you own
// @author       Michael Moreno
// @homepageURL  https://greasyfork.org
// @match        https://www.youtube.com/*
// @match        https://www.youtube.com/watch*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_openInTab
// @license      GPL-3.0
// ==/UserScript==

const UserScriptName = "My Watch Later";
const UserScriptVersion = "1.0.0";

async function main() {
  const addToWatchlistBtn = document.createElement("button");

  addToWatchlistBtn.innerText = "Add to My Watch Later";
  addToWatchlistBtn.id = "addVideoToWatchlist";

  addToWatchlistBtn.addEventListener("click", WatchList.addToWatchlistAsync);

  const ellipsisButton = document.getElementById("logo");

  ellipsisButton.parentNode.insertBefore(
    addToWatchlistBtn,
    ellipsisButton.nextSibling,
  );

  const openWatchLaterBtn = document.createElement("button");

  openWatchLaterBtn.innerText = "Open My Watch Later";

  openWatchLaterBtn.addEventListener("click", WatchLaterPopup.openWatchLaterAsync);

  addToWatchlistBtn.parentNode.insertBefore(
    openWatchLaterBtn,
    addToWatchlistBtn.nextSibling,
  );

  if (!Utils.isVideoUrl(window.location.href)) {
    Utils.removeElementById("addVideoToWatchlist");
  }
}
