import WatchList from "./watchList.js";
import Utils from "./utils.js";

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
    modalWatchlistTitle.innerText = `My Watchlist (${newWatchlist.length})`;

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

export default ArchiveList;
