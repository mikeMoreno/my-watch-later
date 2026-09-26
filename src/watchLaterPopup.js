import WatchList from "./watchList.js";
import ArchiveList from "./archiveList.js";
import Utils from "./utils.js";

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

  static async moveVideoToTopAsync(videoId) {
    const video = await WatchList.getVideoById(videoId);

    await WatchList.moveVideoToTopAsync(video);

    const watchlist = await WatchList.loadWatchlistAsync();

    WatchLaterPopup.populateListUI(watchlist);
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
    width:800px;
    color: white;
    height:300px;
    overflow-y: auto;
    background: black; border: 2px solid white; 
    padding: 20px; z-index: 10000; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
    <h1 id="my-watchlist-title" style="margin-bottom:10px">My Watch Later (${UserScriptVersion})</h1>
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

    // TODO: Remove this code to cache thumbnails of existing videos at a later date.
    await WatchLaterPopup.cacheThumbnailsOfExistingVideosAsync(watchlist);

    const reloadedWatchlist = await WatchList.loadWatchlistAsync();

    WatchLaterPopup.populateListUI(reloadedWatchlist);
  }

  static populateListUI(watchlist) {
    const watchlistVideos = document.getElementById("watchlist-videos");

    watchlistVideos.innerHTML = "";

    for (let i = 0; i < watchlist.length; i++) {
      const video = watchlist[i];

      const videoId = video.id;
      const title = video.title ?? "Couldn't get title";
      const url = video.url;
      const thumbnail = video.thumbnail;

      const idPortion = Utils.getIdPortionOfVideoUrl(url);

      let imgTagHtml;

      if (thumbnail) {
        imgTagHtml = `<img src="${thumbnail}">`;
      } else {
        imgTagHtml = `<img src="https://img.youtube.com/vi/${idPortion}/default.jpg">`;

        console.warn(`VideoId: ${videoId}, Url: ${url}, retrieving thumbnail from YouTube`);
      }

      watchlistVideos.insertAdjacentHTML(
        "beforeend",
        `<li id="watchlist-video-${videoId}" style="margin-top:10px;display: flex;align-items:center">
        <button id="move-video-up-${videoId}" style="margin-right:10px">^</button>
        <button id="move-video-down-${videoId}" style="margin-right:10px">v</button>
        <a style="color: white;font-size:15px;margin-left:10px;margin-right:10px" href="${url}">
          ${imgTagHtml}
        </a>
        <a style="color: white;font-size:15px;margin-left:10px;margin-right:10px" href="${url}">${title}</a>
        <button id="remove-video-${videoId}" style="margin-right:10px">Remove</button>
        <button id="archive-video-${videoId}" style="margin-right:10px">Archive</button>
        <button id="move-to-top-video-${videoId}" style="margin-right:10px">Move to Top</button>
        <a target="_blank" rel="noopener noreferrer" href="https://img.youtube.com/vi/${idPortion}/maxresdefault.jpg">View Thumbnail</a>
      </li>`,
      );

      const btnMoveVideoUp = document.getElementById(`move-video-up-${videoId}`);

      btnMoveVideoUp.addEventListener("click", async () => {
        await WatchList.moveVideoUpAsync(videoId);
      });

      const btnMoveVideoDown = document.getElementById(`move-video-down-${videoId}`);

      btnMoveVideoDown.addEventListener("click", async () => {
        await WatchList.moveVideoDownAsync(videoId);
      });

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

      document
        .getElementById(`move-to-top-video-${videoId}`)
        .addEventListener("click", async () => {
          await WatchLaterPopup.moveVideoToTopAsync(videoId);
        });
    }
  }

  static async cacheThumbnailsOfExistingVideosAsync(watchlist) {
    for (let i = 0; i < watchlist.length; i++) {
      const video = watchlist[i];

      if (video.thumbnail == null) {
        const url = video.url;

        const thumbnail = await WatchList.downloadThumbnailAsync(url);

        video.thumbnail = thumbnail;
      }
    }

    await WatchList.saveWatchlistAsync(watchlist);
  }
}

export default WatchLaterPopup;
