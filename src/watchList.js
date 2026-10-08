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

  static async setOrdinalsOfVideosAsync(watchlist, sortDirection) {
    if (sortDirection === "Ascending") {
      let ordinal = 0;

      for (let i = 0; i < watchlist.length; i++) {
        const video = watchlist[i];

        video.ordinal = ordinal;

        ordinal++;
      }
    } else {
      let ordinal = watchlist.length - 1;

      for (let i = 0; i < watchlist.length; i++) {
        const video = watchlist[i];

        video.ordinal = ordinal;

        ordinal--;
      }
    }
  }

  static async setOrdinalsOfLegacyVideosAsync(watchlist) {
    const missingOrdinals = watchlist.some(v => v.ordinal == null);

    if (!missingOrdinals) {
      return;
    }

    console.warn("Some videos missing ordinals");

    const sortDirection = await Utils.getCurrentSortDirectionAsync();

    if (sortDirection === "Ascending") {
      let ordinal = 0;

      for (let i = 0; i < watchlist.length; i++) {
        const video = watchlist[i];

        video.ordinal = ordinal;

        ordinal++;
      }
    } else {
      let ordinal = watchlist.length - 1;

      for (let i = 0; i < watchlist.length; i++) {
        const video = watchlist[i];

        video.ordinal = ordinal;

        ordinal--;
      }
    }

    await WatchList.saveWatchlistAsync(watchlist);
  }

  static async addToWatchlistAsync() {
    const url = Utils.getCurrentVideoUrl();

    if (url == null) {
      WatchList.showErrorMessage("This doesn't look like a video.");
      return;
    }

    if (await WatchList.isVideoInWatchlistAsync(url)) {

      const video = await WatchList.getVideoByUrl(url);

      const sortDirection = await Utils.getCurrentSortDirectionAsync();

      if (sortDirection === "Descending") {
        await WatchList.moveVideoToTopAsync(video);
        WatchList.showWarningMessage("We already had that video. Moving it to top.");

      } else {
        WatchList.showWarningMessage("We already had that video.");
      }

      // TODO: one day support moving a video to the bottom if sortDirection === asc and we already had video.

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
      ordinal: null,
    };

    await WatchList.addVideoToWatchListAsync(newVideo);

    if (await WatchList.isVideoInWatchlistAsync(url)) {
      WatchList.showInfoMessage("Video added.");
    } else {
      WatchList.showErrorMessage("Failed to add video. Try again.");
    }
  }

  static async addVideoToWatchListAsync(video, moveToTop = false) {
    const watchlist = await WatchList.loadWatchlistAsync();

    const sortDirection = await Utils.getCurrentSortDirectionAsync();

    if (moveToTop || sortDirection === "Descending") {
      watchlist.unshift(video);
    }
    else {
      watchlist.push(video);
    }

    await WatchList.setOrdinalsOfVideosAsync(watchlist, sortDirection);

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

    const tempOrdinal = videoToMove.ordinal;
    videoToMove.ordinal = videoAbove.ordinal;
    videoAbove.ordinal = tempOrdinal;

    watchlist[videoIndex] = videoAbove;
    watchlist[videoIndex - 1] = videoToMove;

    await WatchList.saveWatchlistAsync(watchlist);

    Utils.swapVideos(`watchlist-video-${videoAbove.id}`, `watchlist-video-${videoToMove.id}`);

    if (videoIndex - 1 === 0) {
      let btnMoveVideoUp = document.getElementById(`move-video-up-${videoToMove.id}`);
      btnMoveVideoUp.disabled = true;

      btnMoveVideoUp = document.getElementById(`move-video-up-${videoAbove.id}`);
      btnMoveVideoUp.disabled = false;
    }
    else if (videoIndex === watchlist.length - 1) {
      let btnMoveVideoDown = document.getElementById(`move-video-down-${videoToMove.id}`);
      btnMoveVideoDown.disabled = false;

      btnMoveVideoDown = document.getElementById(`move-video-down-${videoAbove.id}`);
      btnMoveVideoDown.disabled = true;
    }
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

    const tempOrdinal = videoToMove.ordinal;
    videoToMove.ordinal = videoBelow.ordinal;
    videoBelow.ordinal = tempOrdinal;

    watchlist[videoIndex] = videoBelow;
    watchlist[videoIndex + 1] = videoToMove;

    await WatchList.saveWatchlistAsync(watchlist);

    Utils.swapVideos(`watchlist-video-${videoToMove.id}`, `watchlist-video-${videoBelow.id}`);

    if (videoIndex + 1 === watchlist.length - 1) {
      let btnMoveVideoDown = document.getElementById(`move-video-down-${videoToMove.id}`);
      btnMoveVideoDown.disabled = true;

      btnMoveVideoDown = document.getElementById(`move-video-down-${videoBelow.id}`);
      btnMoveVideoDown.disabled = false;
    }
    else if (videoIndex === 0) {
      let btnMoveVideoUp = document.getElementById(`move-video-up-${videoToMove.id}`);
      btnMoveVideoUp.disabled = false;

      btnMoveVideoUp = document.getElementById(`move-video-up-${videoBelow.id}`);
      btnMoveVideoUp.disabled = true;
    }
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

    await WatchList.addVideoToWatchListAsync(video, true);
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

  static showInfoMessage(message) {
    Toastify({
      text: message,
      duration: 3000,
      destination: "https://github.com/apvarun/toastify-js",
      newWindow: true,
      close: true,
      gravity: "top",
      position: "center",
      stopOnFocus: true,
      style: {
        background: "linear-gradient(to right, #00b09b, #96c93d)",
      },
    }).showToast();
  }

  static showWarningMessage(message) {
    Toastify({
      text: message,
      duration: 3000,
      destination: "https://github.com/apvarun/toastify-js",
      newWindow: true,
      close: true,
      gravity: "top",
      position: "center",
      stopOnFocus: true,
      style: {
        background: "linear-gradient(to right, #f2994a, #f2c94c)",
      },
    }).showToast();
  }

  static showErrorMessage(message) {
    Toastify({
      text: message,
      duration: 3000,
      destination: "https://github.com/apvarun/toastify-js",
      newWindow: true,
      close: true,
      gravity: "top",
      position: "center",
      stopOnFocus: true,
      style: {
        background: "linear-gradient(to right, #ff5f6d, #ffc371)",
      },
    }).showToast();
  }
}

export default WatchList;
