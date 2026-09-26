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

      const video = await WatchList.getVideoByUrl(url);

      await WatchList.moveVideoToTopAsync(video);

      alert("We already had that video. Moving it to top.");
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

    const thumbnail = await WatchList.downloadThumbnailAsync(url);

    const newVideo = {
      id: crypto.randomUUID(),
      title,
      url,
      channel,
      dateAdded: Date.now(),
      thumbnail,
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

  static async addVideoToWatchListAtIndexAsync(index, video) {
    const watchlist = await WatchList.loadWatchlistAsync();

    watchlist.splice(index, 0, video);

    await WatchList.saveWatchlistAsync(watchlist);
  }

  // TODO: separate placement for these functions that assume the Watch Later Popup is open? need to refactor

  // This function assumes the Watch Later Popup is open
  static async moveVideoUpAsync(videoId) {
    const watchlist = await WatchList.loadWatchlistAsync();

    const videoIndex = watchlist.findIndex(v => v.id === videoId);

    if (videoIndex === -1) {
      console.error(`Couldn't find the video with id ${videoId}.`);
      return;
    }

    if (videoIndex === 0) {
      console.info(`Video is already at the top.`);
      return;
    }

    const videoAbove = watchlist[videoIndex - 1];
    const videoToMove = watchlist[videoIndex];

    watchlist[videoIndex] = videoAbove;
    watchlist[videoIndex - 1] = videoToMove;

    await WatchList.saveWatchlistAsync(watchlist);

    Utils.swapVideos(`watchlist-video-${videoAbove.id}`, `watchlist-video-${videoToMove.id}`);
  }

  // This function assumes the Watch Later Popup is open
  static async moveVideoDownAsync(videoId) {
    const watchlist = await WatchList.loadWatchlistAsync();

    const videoIndex = watchlist.findIndex(v => v.id === videoId);

    if (videoIndex === -1) {
      console.error(`Couldn't find the video with id ${videoId}.`);
      return;
    }

    if (videoIndex === watchlist.length - 1) {
      console.info(`Video is already at the bottom.`);
      return;
    }

    const videoToMove = watchlist[videoIndex];
    const videoBelow = watchlist[videoIndex + 1];

    watchlist[videoIndex] = videoBelow;
    watchlist[videoIndex + 1] = videoToMove;

    await WatchList.saveWatchlistAsync(watchlist);

    Utils.swapVideos(`watchlist-video-${videoToMove.id}`, `watchlist-video-${videoBelow.id}`);
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

    video.dateAdded = Date.now();

    await WatchList.addVideoToWatchListAsync(video);
  }

  static convertBlobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  static async downloadThumbnailAsync(url) {
    const idPortion = Utils.getIdPortionOfVideoUrl(url);

    const response = await fetch(`https://img.youtube.com/vi/${idPortion}/default.jpg`);
    const blob = await response.blob();

    const base64String = await WatchList.convertBlobToBase64(blob);

    return base64String;
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
