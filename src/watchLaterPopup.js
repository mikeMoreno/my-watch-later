import WatchList from "./watchList.js";
import ArchiveList from "./archiveList.js";
import Utils from "./utils.js";

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

export default WatchLaterPopup;