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

"use strict";

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

  openWatchLaterBtn.addEventListener(
    "click",
    WatchLaterPopup.openWatchLaterAsync,
  );

  addToWatchlistBtn.parentNode.insertBefore(
    openWatchLaterBtn,
    addToWatchlistBtn.nextSibling,
  );

  if (!Utils.isVideoUrl(window.location.href)) {
    Utils.removeElementById("addVideoToWatchlist");
  }
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

    const videoToArchive = watchlist.filter(
      (v, index) => index === indexToArchive,
    )[0];

    const newWatchlist = watchlist.filter(
      (v, index) => index !== indexToArchive,
    );

    await WatchList.saveWatchlistAsync(newWatchlist);

    Utils.removeElementById(`watchlist-video-${indexToArchive}`);

    var modalWatchlistTitle = document.getElementById("my-watchlist-title");
    modalWatchlistTitle.innerText = `My Watchlist (${UserScriptVersion}) (${newWatchlist.length})`;

    const addToWatchlistBtn = document.getElementById("addVideoToWatchlist");
    addToWatchlistBtn.disabled = false;

    const archiveList = await ArchiveList.loadArchiveListAsync();

    archiveList.push(videoToArchive);

    await ArchiveList.saveArchiveListAsync(archiveList);
  }

  static async viewArchiveAsync() {
    const archiveList = await ArchiveList.loadArchiveListAsync();

    let archivedVideos = "";

    for (let i = 0; i < archiveList.length; i++) {
      archivedVideos += archiveList[i].title + "\n";
      archivedVideos += archiveList[i].url + "\n";
      archivedVideos += archiveList[i].channel + "\n";
      archivedVideos += archiveList[i].dateAdded + "\n";
      archivedVideos += "====\n";
    }

    alert(archivedVideos);
  }
}

class Utils {
  static SortDirectionKey = "sortDirection";

  static removeElementById(id) {
    var element = document.getElementById(id);
    element.parentNode.removeChild(element);
  }

  static getIdPortionOfVideoUrl(url) {
    return url.substring(url.indexOf("?v=") + 3);
  }

  static getCurrentVideoUrl() {
    let url = window.location.href;

    if (!Utils.isVideoUrl(url)) {
      return null;
    }

    if (url.indexOf("&") > 0) {
      url = url.substring(0, url.indexOf("&"));
    }

    return url;
  }

  static isVideoUrl(url) {
    if (url == null || url.indexOf("watch?v=") < 0) {
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
      watchlist.sort(function (videoA, videoB) {
        return videoB.dateAdded - videoA.dateAdded;
      });
    } else {
      watchlist.sort(function (videoA, videoB) {
        return videoA.dateAdded - videoB.dateAdded;
      });
    }

    const nextDirection =
      sortDirection === "Ascending" ? "Descending" : "Ascending";

    await Utils.setSortDirectionAsync(nextDirection);

    await WatchList.saveWatchlistAsync(watchlist);

    WatchLaterPopup.populateListUI(watchlist);

    var changeSortBtn = document.getElementById("change-sort-direction");
    changeSortBtn.innerText = `Sort: ${nextDirection}`;
  }

  static async openWatchLaterAsync() {
    const sortDirection = await Utils.getCurrentSortDirectionAsync();

    const watchlist = await WatchList.loadWatchlistAsync();

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
    <h2 id="my-watchlist-title">My Watchlist (${UserScriptVersion}) (${watchlist.length})</h2>
    <button id="change-sort-direction">Sort: ${sortDirection}</button>
    <button id="view-archive">View Archive</button>
    <button id="close-watchlist-top">Close</button>
    <ul id="watchlist-videos"></ul>
    <button id="close-watchlist-bottom" style="margin-top:10px">Close</button>
</div>
`;

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
      .getElementById("view-archive")
      .addEventListener("click", async () => {
        await ArchiveList.viewArchiveAsync();
      });

    WatchLaterPopup.populateListUI(watchlist);
  }

  static populateListUI(watchlist) {
    const watchlistVideos = document.getElementById("watchlist-videos");

    watchlistVideos.innerHTML = "";

    for (let i = 0; i < watchlist.length; i++) {
      const url = watchlist[i].url;

      watchlistVideos.insertAdjacentHTML(
        "beforeend",
        `<li id="watchlist-video-${i}" style="margin-top:10px;display: flex;align-items:center">
      <img src="https://img.youtube.com/vi/${Utils.getIdPortionOfVideoUrl(url)}/default.jpg">
        <a style="color: white;font-size:15px;margin-left:10px;margin-right:10px" href="${url}">${watchlist[i].title}</a>
        <button id="remove-video-${i}" style="margin-right:10px">Remove</button>
        <button id="archive-video-${i}">Archive</button>
      </li>`,
      );

      document
        .getElementById(`remove-video-${i}`)
        .addEventListener("click", async () => {
          await WatchList.removeVideoAsync(i);
        });

      document
        .getElementById(`archive-video-${i}`)
        .addEventListener("click", async () => {
          await ArchiveList.archiveVideoAsync(i);
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
      .substring(0, ownerElement.innerText.indexOf("\n"))
      .trim();

    const newVideo = {
      title: title,
      url: url,
      channel: channel,
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

  static async removeVideoAsync(indexToRemove) {
    const watchlist = await WatchList.loadWatchlistAsync();

    if (watchlist.length === 0) {
      return;
    }

    const newWatchlist = watchlist.filter(
      (v, index) => index !== indexToRemove,
    );

    await WatchList.saveWatchlistAsync(newWatchlist);

    Utils.removeElementById(`watchlist-video-${indexToRemove}`);

    var modalWatchlistTitle = document.getElementById("my-watchlist-title");
    modalWatchlistTitle.innerText = `My Watchlist (${UserScriptVersion}) (${newWatchlist.length})`;

    const addToWatchlistBtn = document.getElementById("addVideoToWatchlist");
    addToWatchlistBtn.disabled = false;
  }

  static async isVideoInWatchlistAsync(url) {
    const watchlist = await WatchList.loadWatchlistAsync();

    if (watchlist.some((v) => v.url === url)) {
      return true;
    }

    return false;
  }
}

main();
