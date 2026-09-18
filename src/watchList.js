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

      const video = await this.getVideoByUrl(url);

      await WatchList.moveVideoToTopAsync(video);

      alert("We already had that video");
      return;
    }

    const titleElement = document.getElementById("title");

    let title = titleElement.innerText.trim();

    if (title === "") {
      title = null;
    }

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

    await WatchList.addVideoToWatchListAsync(newVideo);

    alert("Video added");
  }

  static async addVideoToWatchListAsync(video) {
    const watchlist = await WatchList.loadWatchlistAsync();

    const sortDirection = await Utils.getCurrentSortDirectionAsync();

    if (sortDirection === "Ascending") {
      watchlist.push(video);
    } else {
      watchlist.unshift(video);
    }

    await WatchList.saveWatchlistAsync(watchlist);
  }

  // This function assumes the Watch Later Popup is open
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

  // This function is just for removing a video from the watchlist.
  // TODO: cleanup
  static async removeVideoFromWatchListAsync(video) {
    const watchlist = await WatchList.loadWatchlistAsync();

    if (watchlist.length === 0) {
      return;
    }

    const newWatchlist = watchlist.filter((v) => v.id !== video.id);

    await WatchList.saveWatchlistAsync(newWatchlist);
  }

  static async getVideoById(id) {
    const watchlist = await WatchList.loadWatchlistAsync();

    const video = watchlist.find((v) => v.id === id);

    return video;
  }

  static async getVideoByUrl(url) {
    const watchlist = await WatchList.loadWatchlistAsync();

    const video = watchlist.find((v) => v.url === url);

    return video;
  }

  static async isVideoInWatchlistAsync(url) {
    const video = await WatchList.getVideoByUrl(url);

    return video != null;
  }

  static async moveVideoToTopAsync(video) {
    await WatchList.removeVideoFromWatchListAsync(video);

    await WatchList.addVideoToWatchListAsync(video);
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

export default WatchList;
