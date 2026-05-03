import { loadWatchlistAsync, saveWatchlistAsync } from "./watchList.js";
import { removeElementById } from "./utils.js";

async function loadArchiveListAsync() {
  /* eslint-disable no-undef */
  const archiveList = (await GM.getValue(ArchiveList)) ?? "";
  /* eslint-enable no-undef */

  if (archiveList == null || archiveList === "") {
    return [];
  }

  return JSON.parse(archiveList);
}

async function saveArchiveListAsync(archiveList) {
  /* eslint-disable no-undef */
  await GM.setValue(ArchiveList, JSON.stringify(archiveList));
  /* eslint-enable no-undef */
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

async function viewArchiveAsync() {
  const archiveList = await loadArchiveListAsync();

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
