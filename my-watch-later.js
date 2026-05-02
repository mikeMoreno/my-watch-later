// ==UserScript==
// @name         My Watch Later
// @author       Michael Moreno
// @description  A better Watch Later feature
// @homepageURL  https://greasyfork.org
// @match        https://www.youtube.com/*
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

function getCurrentVideoUrl() {
  let url = window.location.href;

  if (url.indexOf("&") > 0) {
    url = url.substring(0, url.indexOf("&"));
  }

  return url;
}

function getIdPortionOfVideoUrl(url) {
  return url.substring(url.indexOf("?v=") + 3);
}

async function isVideoInWatchlistAsync(url) {
  const watchlist = await loadWatchlistAsync();

  if (watchlist.some((v) => v.url === url)) {
    return true;
  }

  return false;
}

async function checkIfWeAlreadyHaveVideoAsync() {
  const url = getCurrentVideoUrl();

  if (!(await isVideoInWatchlistAsync(url))) {
    return;
  }

  const addToWatchlistBtn = document.getElementById("addVideoToWatchlist");
  addToWatchlistBtn.disabled = true;
}

function removeElementById(id) {
  var element = document.getElementById(id);
  element.parentNode.removeChild(element);
}

async function removeVideoAsync(indexToRemove) {
  const watchlist = await loadWatchlistAsync();

  if (watchlist.length === 0) {
    return;
  }

  const newWatchlist = watchlist.filter((v, index) => index !== indexToRemove);

  await saveWatchlistAsync(newWatchlist);

  removeElementById(`watchlist-video-${indexToRemove}`);

  var modalWatchlistTitle = document.getElementById("my-watchlist-title");
  modalWatchlistTitle.innerText = `My Watchlist (${newWatchlist.length})`;

  const addToWatchlistBtn = document.getElementById("addVideoToWatchlist");
  addToWatchlistBtn.disabled = false;
}

async function addToWatchlistAsync() {
  const url = getCurrentVideoUrl();

  if (await isVideoInWatchlistAsync(url)) {
    const addToWatchlistBtn = document.getElementById("addVideoToWatchlist");
    addToWatchlistBtn.disabled = true;

    alert("We already had that video");
    return;
  }

  const watchlist = await loadWatchlistAsync();

  const titleElement = document.getElementById("title");

  const title = titleElement.innerText.trim();

  const newVideo = {
    title: title,
    url: url,
  };

  watchlist.push(newVideo);

  await saveWatchlistAsync(watchlist);

  const addToWatchlistBtn = document.getElementById("addVideoToWatchlist");
  addToWatchlistBtn.disabled = true;

  alert("Video added");
}

async function openWatchLaterAsync() {
  const watchlist = await loadWatchlistAsync();

  const watchlistPopup = `
<div id="my-watchlist" style="
    position: fixed; top: 50%; left: 50%; 
    transform: translate(-50%, -50%);
    width: 700px;
    height:300px;
    overflow-y: auto;
    background: black; border: 2px solid black; 
    padding: 20px; z-index: 10000; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
    <h2 id="my-watchlist-title">My Watchlist (${watchlist.length})</h2>
    <ul id="watchlist-videos"></ul>
    <button id="close-watchlist">Close</button>
</div>
`;

  document.body.insertAdjacentHTML("beforeend", watchlistPopup);

  const watchlistVideos = document.getElementById("watchlist-videos");

  for (let i = 0; i < watchlist.length; i++) {
    const url = watchlist[i].url;

    watchlistVideos.insertAdjacentHTML(
      "beforeend",
      `<li id="watchlist-video-${i}" style="margin-top:10px;display: flex;align-items:center">
      <img src="https://img.youtube.com/vi/${getIdPortionOfVideoUrl(url)}/default.jpg">
        <a style="color: white;font-size:15px;margin-left:10px;margin-right:10px" href="${url}">${watchlist[i].title}</a>
        <button id="remove-video-${i}">Remove</button>
      </li>`,
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

async function main() {
  const addToWatchlistBtn = document.createElement("button");

  addToWatchlistBtn.innerText = "Add to My Watch Later";
  addToWatchlistBtn.id = "addVideoToWatchlist";

  addToWatchlistBtn.addEventListener("click", addToWatchlistAsync);

  const ellipsisButton = document.getElementById("logo");

  ellipsisButton.parentNode.insertBefore(
    addToWatchlistBtn,
    ellipsisButton.nextSibling,
  );

  const openWatchLaterBtn = document.createElement("button");

  openWatchLaterBtn.innerText = "Open My Watch Later";

  openWatchLaterBtn.addEventListener("click", openWatchLaterAsync);

  addToWatchlistBtn.parentNode.insertBefore(
    openWatchLaterBtn,
    addToWatchlistBtn.nextSibling,
  );

  if (window.location.href.indexOf("watch") < 0) {
    removeElementById("addVideoToWatchlist");
  } else {
    await checkIfWeAlreadyHaveVideoAsync();
  }
}

// Google likes to be cute with their web pages.
// Add a delay to make sure script is executed
// after they're done shifting the elements around.
// The @run-at metadata key is not enough.
setTimeout(() => {
  main();
}, 2000);
