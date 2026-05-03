import { getCurrentVideoUrl, getCurrentSortDirectionAsync, removeElementById } from "./utils.js";

export async function loadWatchlistAsync() {
  /* eslint-disable no-undef */
  const watchlist = (await GM.getValue(WatchList)) ?? "";
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

async function saveWatchlistAsync(watchlist) {
  /* eslint-disable no-undef */
  await GM.setValue(WatchList, JSON.stringify(watchlist));
  /* eslint-enable no-undef */
}

async function isVideoInWatchlistAsync(url) {
  const watchlist = await loadWatchlistAsync();

  if (watchlist.some((v) => v.url === url)) {
    return true;
  }

  return false;
}

export async function addToWatchlistAsync() {
  const url = getCurrentVideoUrl();

  if (url == null) {
    alert("This doesn't look like a video");
    return;
  }

  if (await isVideoInWatchlistAsync(url)) {
    alert("We already had that video");
    return;
  }

  const watchlist = await loadWatchlistAsync();

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

  const sortDirection = await getCurrentSortDirectionAsync();

  if (sortDirection === "Ascending") {
    watchlist.push(newVideo);
  } else {
    watchlist.unshift(newVideo);
  }

  await saveWatchlistAsync(watchlist);

  alert("Video added");
}

export async function removeVideoAsync(indexToRemove) {
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
