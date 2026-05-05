class Utils {
  static SortDirectionKey = "sortDirection";

  static removeElementById(id) {
    const element = document.getElementById(id);
    element.parentNode.removeChild(element);
  }

  static showButton(id) {
    const button = document.getElementById(id);
    button.style.display = "inline-block";
  }

  static hideButton(id) {
    const button = document.getElementById(id);
    button.style.display = "none";
  }

  static getIdPortionOfVideoUrl(url) {
    return url.slice(url.indexOf("?v=") + 3);
  }

  static getCurrentVideoUrl() {
    let url = window.location.href;

    if (!Utils.isVideoUrl(url)) {
      return null;
    }

    url = url.slice(0, url.indexOf("watch?"));

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const videoId = urlParams.get("v");

    if (videoId == null) {
      return null;
    }

    url += `watch?v=${videoId}`;

    return url;
  }

  static isVideoUrl(url) {
    if (url == null || !url.includes("watch?")) {
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

export default Utils;
