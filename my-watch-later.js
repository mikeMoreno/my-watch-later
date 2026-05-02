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

async function loadArchiveListAsync() {
  const archiveList = (await GM.getValue("archiveList")) ?? "";

  if (!archiveList || archiveList === "") {
    return [];
  }

  return JSON.parse(archiveList);
}

async function saveArchiveListAsync(archiveList) {
  await GM.setValue("archiveList", JSON.stringify(archiveList));
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

async function archiveVideoAsync(indexToArchive) {
  const watchlist = await loadWatchlistAsync();

  if (watchlist.length === 0) {
    return;
  }

  const videoToArchive = watchlist.filter(
    (v, index) => index === indexToArchive,
  )[0];

  const newWatchlist = watchlist.filter((v, index) => index !== indexToArchive);

  await saveWatchlistAsync(newWatchlist);

  removeElementById(`watchlist-video-${indexToArchive}`);

  var modalWatchlistTitle = document.getElementById("my-watchlist-title");
  modalWatchlistTitle.innerText = `My Watchlist (${newWatchlist.length})`;

  const addToWatchlistBtn = document.getElementById("addVideoToWatchlist");
  addToWatchlistBtn.disabled = false;

  const archiveList = await loadArchiveListAsync();

  archiveList.push(videoToArchive);

  await saveArchiveListAsync(archiveList);
}

async function changeSortDirectionAsync() {
  const watchlist = await loadWatchlistAsync();

  if (watchlist.length === 0) {
    return;
  }

  const sortedList = [];

  for (let i = watchlist.length - 1; i >= 0; i--) {
    sortedList.push(watchlist[i]);
  }

  await saveWatchlistAsync(sortedList);

  populateListUI(sortedList);
}

async function viewArchiveAsync() {
  const archiveList = await loadArchiveListAsync();

  let archivedVideos = "";

  for (let i = 0; i < archiveList.length; i++) {
    archivedVideos += archiveList[i].title + "\n";
    archivedVideos += archiveList[i].url + "\n";
    archivedVideos += "====\n";
  }

  alert(archivedVideos);
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

function populateListUI(watchlist) {
  const watchlistVideos = document.getElementById("watchlist-videos");

  watchlistVideos.innerHTML = "";

  for (let i = 0; i < watchlist.length; i++) {
    const url = watchlist[i].url;

    watchlistVideos.insertAdjacentHTML(
      "beforeend",
      `<li id="watchlist-video-${i}" style="margin-top:10px;display: flex;align-items:center">
      <img src="https://img.youtube.com/vi/${getIdPortionOfVideoUrl(url)}/default.jpg">
        <a style="color: white;font-size:15px;margin-left:10px;margin-right:10px" href="${url}">${watchlist[i].title}</a>
        <button id="remove-video-${i}" style="margin-right:10px">Remove</button>
        <button id="archive-video-${i}">Archive</button>
      </li>`,
    );

    document
      .getElementById(`remove-video-${i}`)
      .addEventListener("click", async () => {
        await removeVideoAsync(i);
      });

    document
      .getElementById(`archive-video-${i}`)
      .addEventListener("click", async () => {
        await archiveVideoAsync(i);
      });
  }
}

async function openWatchLaterAsync() {
  const watchlist = await loadWatchlistAsync();

  const watchlistPopup = `
<div id="my-watchlist" style="
    position: fixed; top: 50%; left: 50%; 
    transform: translate(-50%, -50%);
    width: 700px;
    color: white;
    height:300px;
    overflow-y: auto;
    background: black; border: 2px solid black; 
    padding: 20px; z-index: 10000; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
    <h2 id="my-watchlist-title">My Watchlist (${watchlist.length})</h2>
    <button id="change-sort-direction">Change Sort Direction</button>
    <button id="view-archive">View Archive</button>
    <ul id="watchlist-videos"></ul>
    <button id="close-watchlist">Close</button>
</div>
`;

  document.body.insertAdjacentHTML("beforeend", watchlistPopup);

  document.getElementById("close-watchlist").addEventListener("click", () => {
    document.getElementById("my-watchlist").remove();
  });

  document
    .getElementById("change-sort-direction")
    .addEventListener("click", async () => {
      await changeSortDirectionAsync();
    });

  document
    .getElementById("view-archive")
    .addEventListener("click", async () => {
      await viewArchiveAsync();
    });

  populateListUI(watchlist);
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
