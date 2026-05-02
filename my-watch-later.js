// ==UserScript==
// @name         My Watch Later
// @author       Michael Moreno
// @description  A better Watch Later feature
// @homepageURL  https://greasyfork.org
// @match        https://www.youtube.com/watch*
// @version      1.0.0
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_openInTab
// @license      GPL-3.0
// ==/UserScript==

"use strict";

const UserScriptName = "My Watch Later";
const UserScriptVersion = "1.0.0";

async function loadWatchlistAsync() {
  const watchlist = (await GM.getValue("watchlist")) ?? "";

  if (!watchlist || watchlist === "") {
    return [];
  }

  return JSON.parse(watchlist);
}

async function saveWatchlistAsync(watchlist) {
  await GM.setValue("watchlist", JSON.stringify(watchlist));
}

async function removeVideoAsync(indexToRemove) {
  const watchlist = await loadWatchlistAsync();

  if (watchlist.length === 0) {
    return;
  }

  const newWatchlist = watchlist.filter((v, index) => index !== indexToRemove);

  await saveWatchlistAsync(newWatchlist);

  var videoInWatchlist = document.getElementById(
    `watchlist-video-${indexToRemove}`,
  );
  videoInWatchlist.parentNode.removeChild(videoInWatchlist);
}

async function addToWatchLaterAsync() {
  const titleElement = document.getElementById("title");

  const title = titleElement.innerText.trim();

  const url = window.location.href;

  const newVideo = {
    title: title,
    url: url,
  };

  const watchlist = await loadWatchlistAsync();

  console.log("old watchlist");
  for (let i = 0; i < watchlist.length; i++) {
    console.log(watchlist[i].title + " " + watchlist[i].url);
  }

  watchlist.push(newVideo);
  console.log("=============================");

  console.log("new watchlist");

  for (let i = 0; i < watchlist.length; i++) {
    console.log(watchlist[i].title + " " + watchlist[i].url);
  }

  await saveWatchlistAsync(watchlist);
}

async function openWatchLaterAsync() {
  const watchlist = await loadWatchlistAsync();

  const watchlistPopup = `
<div id="my-watchlist" style="
    position: fixed; top: 50%; left: 50%; 
    transform: translate(-50%, -50%);
    width:500px;
    background: white; border: 2px solid black; 
    padding: 20px; z-index: 10000; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
    <h2>My Watchlist</h2>
    <ul id="watchlist-videos"></ul>
    <button id="close-watchlist">Close</button>
</div>
`;

  // 2. Add it to the page
  document.body.insertAdjacentHTML("beforeend", watchlistPopup);

  const watchlistVideos = document.getElementById("watchlist-videos");

  for (let i = 0; i < watchlist.length; i++) {
    watchlistVideos.insertAdjacentHTML(
      "beforeend",
      `<li id="watchlist-video-${i}"><a href="${watchlist[i].url}">${watchlist[i].title}</a><button id="remove-video-${i}">Remove</button></li>`,
    );

    document
      .getElementById(`remove-video-${i}`)
      .addEventListener("click", async () => {
        await removeVideoAsync(i);
      });
  }

  document.getElementById("close-watchlist").addEventListener("click", () => {
    document.getElementById("my-watchlist").remove();
  });
}

// TODO: disable button if already in watch later
async function main() {
  // TODO: style this
  const addToWatchLaterBtn = document.createElement("button");

  addToWatchLaterBtn.innerText = "Add to My Watch Later";
  addToWatchLaterBtn.classList.add("style-scope", "ytd-watch-metadata");

  addToWatchLaterBtn.addEventListener("click", addToWatchLaterAsync);

  const ellipsisButton = document.getElementById("button-shape");
  ellipsisButton.parentNode.insertBefore(
    addToWatchLaterBtn,
    ellipsisButton.nextSibling,
  );

  const openWatchLaterBtn = document.createElement("button");

  openWatchLaterBtn.innerText = "Open My Watch Later";
  openWatchLaterBtn.classList.add("style-scope", "ytd-watch-metadata");

  openWatchLaterBtn.addEventListener("click", openWatchLaterAsync);

  addToWatchLaterBtn.parentNode.insertBefore(
    openWatchLaterBtn,
    addToWatchLaterBtn.nextSibling,
  );
}

// Google likes to be cute with their web pages.
// Add a delay to make sure script is executed
// after they're done shifting the elements around.
// The @run-at metadata key is not enough.
setTimeout(() => {
  main();
}, 2000);
