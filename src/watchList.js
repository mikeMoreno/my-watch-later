import Utils from "./utils.js";

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

    const videoCountElement = document.getElementById("videoCount");
    videoCountElement.innerText = `${newWatchlist.length} videos`;
  }

  static async isVideoInWatchlistAsync(url) {
    const watchlist = await WatchList.loadWatchlistAsync();

    if (watchlist.some((v) => v.url === url)) {
      return true;
    }

    return false;
  }
}

export default WatchList;
