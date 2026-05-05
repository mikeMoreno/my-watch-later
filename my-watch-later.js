// ==UserScript==
// @name         My Watch Later
// @namespace    http://www.mikesbytes.net/userscripts
// @version      1.1.0
// @description  A YouTube Watch Later feature that you own
// @author       Michael Moreno
// @homepageURL  https://greasyfork.org/en/scripts/576490-my-watch-later
// @match        https://www.youtube.com/*
// @match        https://www.youtube.com/watch*
// @grant        GM.getValue
// @grant        GM.setValue
// @license      GPL-3.0
// ==/UserScript==

"use strict";

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

class ArchiveList {
  static ArchiveListKey = "archiveList";

  static async loadArchiveListAsync() {
    /* eslint-disable no-undef */
    const archiveList = (await GM.getValue(ArchiveList.ArchiveListKey)) ?? "";
    /* eslint-enable no-undef */

    if (archiveList == null || archiveList === "") {
      return [];
    }

    return JSON.parse(archiveList);
  }

  static async saveArchiveListAsync(archiveList) {
    /* eslint-disable no-undef */
    await GM.setValue(ArchiveList.ArchiveListKey, JSON.stringify(archiveList));
    /* eslint-enable no-undef */
  }

  static async archiveVideoAsync(indexToArchive) {
    const watchlist = await WatchList.loadWatchlistAsync();

    if (watchlist.length === 0) {
      return;
    }

    const videoToArchive = watchlist.find(
      (v, index) => index === indexToArchive,
    );

    const newWatchlist = watchlist.filter(
      (v, index) => index !== indexToArchive,
    );

    await WatchList.saveWatchlistAsync(newWatchlist);

    Utils.removeElementById(`watchlist-video-${indexToArchive}`);

    const videoCountElement = document.getElementById("videoCount");

    if (newWatchlist.length === 1) {
      videoCountElement.innerText = `${newWatchlist.length} video`;
    } else {
      videoCountElement.innerText = `${newWatchlist.length} videos`;
    }

    const archiveList = await ArchiveList.loadArchiveListAsync();

    archiveList.push(videoToArchive);

    await ArchiveList.saveArchiveListAsync(archiveList);
  }

  static async viewArchiveAsync() {
    const archiveList = await ArchiveList.loadArchiveListAsync();

    let archivedVideos = "";

    /* eslint-disable prefer-template */
    for (let i = 0; i < archiveList.length; i++) {
      archivedVideos += archiveList[i].title + "\n";
      archivedVideos += archiveList[i].url + "\n";
      archivedVideos += archiveList[i].channel + "\n";
      archivedVideos += archiveList[i].dateAdded + "\n";
      archivedVideos += "====\n";
    }
    /* eslint-enable prefer-template */

    alert(archivedVideos);
  }
}

class Utils {
  static SortDirectionKey = "sortDirection";

  static removeElementById(id) {
    const element = document.getElementById(id);
    element.parentNode.removeChild(element);
  }

  static showButton(id) {
    const button = document.getElementById(id);
    button.style.display = "inline-block";
  }

  static hideButton(id) {
    const button = document.getElementById(id);
    button.style.display = "none";
  }

  static getIdPortionOfVideoUrl(url) {
    return url.slice(url.indexOf("?v=") + 3);
  }

  static getCurrentVideoUrl() {
    let url = window.location.href;

    if (!Utils.isVideoUrl(url)) {
      return null;
    }

    if (url.includes("&")) {
      url = url.slice(0, url.indexOf("&"));
    }

    return url;
  }

  static isVideoUrl(url) {
    if (url == null || !url.includes("watch?")) {
      return false;
    }

    return true;
  }

  static async getCurrentSortDirectionAsync() {
    /* eslint-disable no-undef */
    const sortDirection =
      (await GM.getValue(Utils.SortDirectionKey)) ?? "Ascending";
    /* eslint-enable no-undef */

    return sortDirection;
  }

  static async setSortDirectionAsync(nextDirection) {
    /* eslint-disable no-undef */
    await GM.setValue(Utils.SortDirectionKey, nextDirection);
    /* eslint-enable no-undef */
  }
}

class WatchLaterPopup {
  static async changeSortDirectionAsync() {
    const watchlist = await WatchList.loadWatchlistAsync();

    const sortDirection = await Utils.getCurrentSortDirectionAsync();

    if (sortDirection === "Ascending") {
      watchlist.sort((videoA, videoB) => videoB.dateAdded - videoA.dateAdded);
    } else {
      watchlist.sort((videoA, videoB) => videoA.dateAdded - videoB.dateAdded);
    }

    const nextDirection =
      sortDirection === "Ascending" ? "Descending" : "Ascending";

    await Utils.setSortDirectionAsync(nextDirection);

    await WatchList.saveWatchlistAsync(watchlist);

    WatchLaterPopup.populateListUI(watchlist);

    const changeSortBtn = document.getElementById("change-sort-direction");
    changeSortBtn.innerText = `Sort: ${nextDirection}`;
  }

  static async openWatchLaterAsync() {
    const previouslyExistingPopup = document.getElementById("my-watchlist");

    if (previouslyExistingPopup) {
      return;
    }

    const sortDirection = await Utils.getCurrentSortDirectionAsync();

    const watchlist = await WatchList.loadWatchlistAsync();

    /* eslint-disable no-undef */
    const watchlistPopup = `
<div id="my-watchlist" style="
    position: fixed; top: 50%; left: 50%; 
    transform: translate(-50%, -50%);
    width: 700px;
    color: white;
    height:300px;
    overflow-y: auto;
    background: black; border: 2px solid white; 
    padding: 20px; z-index: 10000; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
    <h1 id="my-watchlist-title" style="margin-bottom:10px">My Watchlist (${UserScriptVersion})</h1>
    <div style="margin-bottom:10px">
      <button id="change-sort-direction">Sort: ${sortDirection}</button>
      <button id="export-watchlist">Export</button>
      <button id="close-watchlist-top">Close</button>
    </div>
    <h2 id="videoCount"></h2>
    <ul id="watchlist-videos"></ul>
    <button id="close-watchlist-bottom" style="margin-top:10px">Close</button>
</div>
`;
    /* eslint-enable no-undef */

    document.body.insertAdjacentHTML("beforeend", watchlistPopup);

    document
      .getElementById("close-watchlist-top")
      .addEventListener("click", () => {
        document.getElementById("my-watchlist").remove();
      });

    document
      .getElementById("close-watchlist-bottom")
      .addEventListener("click", () => {
        document.getElementById("my-watchlist").remove();
      });

    document
      .getElementById("change-sort-direction")
      .addEventListener("click", async () => {
        await WatchLaterPopup.changeSortDirectionAsync();
      });

    document
      .getElementById("export-watchlist")
      .addEventListener("click", async () => {
        await WatchList.exportWatchlistAsync();
      });

    const videoCountElement = document.getElementById("videoCount");

    if (watchlist.length === 1) {
      videoCountElement.innerText = `${watchlist.length} video`;
    } else {
      videoCountElement.innerText = `${watchlist.length} videos`;
    }

    WatchLaterPopup.populateListUI(watchlist);
  }

  static populateListUI(watchlist) {
    const watchlistVideos = document.getElementById("watchlist-videos");

    watchlistVideos.innerHTML = "";

    for (let i = 0; i < watchlist.length; i++) {
      const videoId = watchlist[i].id;
      const title = watchlist[i].title;
      const url = watchlist[i].url;

      watchlistVideos.insertAdjacentHTML(
        "beforeend",
        `<li id="watchlist-video-${videoId}" style="margin-top:10px;display: flex;align-items:center">
      <img src="https://img.youtube.com/vi/${Utils.getIdPortionOfVideoUrl(url)}/default.jpg">
        <a style="color: white;font-size:15px;margin-left:10px;margin-right:10px" href="${url}">${title}</a>
        <button id="remove-video-${videoId}" style="margin-right:10px">Remove</button>
        <button id="archive-video-${videoId}">Archive</button>
      </li>`,
      );

      document
        .getElementById(`remove-video-${videoId}`)
        .addEventListener("click", async () => {
          await WatchList.removeVideoAsync(videoId);
        });

      document
        .getElementById(`archive-video-${videoId}`)
        .addEventListener("click", async () => {
          await ArchiveList.archiveVideoAsync(videoId);
        });
    }
  }
}

class WatchList {
  static WatchListKey = "watchlist";

  static async loadWatchlistAsync() {
    /* eslint-disable no-undef */
    const watchlist = (await GM.getValue(WatchList.WatchListKey)) ?? "";
    /* eslint-enable no-undef */

    if (watchlist == null || watchlist === "") {
      return [];
    }

    const parsedWatchlist = JSON.parse(watchlist);

    const parsedWatchlistWithDates = parsedWatchlist.map((video) => ({
      ...video,
      dateAdded: new Date(video.dateAdded),
    }));

    return parsedWatchlistWithDates;
  }

  static async saveWatchlistAsync(watchlist) {
    /* eslint-disable no-undef */
    await GM.setValue(WatchList.WatchListKey, JSON.stringify(watchlist));
    /* eslint-enable no-undef */
  }

  static async addToWatchlistAsync() {
    const url = Utils.getCurrentVideoUrl();

    if (url == null) {
      alert("This doesn't look like a video");
      return;
    }

    if (await WatchList.isVideoInWatchlistAsync(url)) {
      alert("We already had that video");
      return;
    }

    const watchlist = await WatchList.loadWatchlistAsync();

    const titleElement = document.getElementById("title");

    const title = titleElement.innerText.trim();

    const ownerElement = document.getElementById("owner");

    const channel = ownerElement.innerText
      .slice(0, ownerElement.innerText.indexOf("\n"))
      .trim();

    const newVideo = {
      id: crypto.randomUUID(),
      title,
      url,
      channel,
      dateAdded: Date.now(),
    };

    const sortDirection = await Utils.getCurrentSortDirectionAsync();

    if (sortDirection === "Ascending") {
      watchlist.push(newVideo);
    } else {
      watchlist.unshift(newVideo);
    }

    await WatchList.saveWatchlistAsync(watchlist);

    alert("Video added");
  }

  static async removeVideoAsync(id) {
    const watchlist = await WatchList.loadWatchlistAsync();

    if (watchlist.length === 0) {
      return;
    }

    const newWatchlist = watchlist.filter((v) => v.id !== id);

    await WatchList.saveWatchlistAsync(newWatchlist);

    Utils.removeElementById(`watchlist-video-${id}`);

    const videoCountElement = document.getElementById("videoCount");

    if (newWatchlist.length === 1) {
      videoCountElement.innerText = `${newWatchlist.length} video`;
    } else {
      videoCountElement.innerText = `${newWatchlist.length} videos`;
    }
  }

  static async isVideoInWatchlistAsync(url) {
    const watchlist = await WatchList.loadWatchlistAsync();

    if (watchlist.some((v) => v.url === url)) {
      return true;
    }

    return false;
  }

  static async exportWatchlistAsync() {
    const watchlist = await WatchList.loadWatchlistAsync();

    /* eslint-disable n/no-unsupported-features/node-builtins */
    const data = {
      /* eslint-disable no-undef */
      source: UserScriptName,
      version: UserScriptVersion,
      /* eslint-enable no-undef */
      watchlist,
    };

    const blob = new Blob([JSON.stringify(data)], {
      type: "text/plain;charset=utf-8",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "exported_watchlist.json";

    link.click();

    URL.revokeObjectURL(link.href);
    /* eslint-enable n/no-unsupported-features/node-builtins */
  }
}

main();
