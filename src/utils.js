class Utils {
  static SortDirectionKey = "sortDirection";

  static removeElementById(id) {
    var element = document.getElementById(id);
    element.parentNode.removeChild(element);
  }

  static getIdPortionOfVideoUrl(url) {
    return url.substring(url.indexOf("?v=") + 3);
  }

  static getCurrentVideoUrl() {
    let url = window.location.href;

    if (!Utils.isVideoUrl(url)) {
      return null;
    }

    if (url.indexOf("&") > 0) {
      url = url.substring(0, url.indexOf("&"));
    }

    return url;
  }

  static isVideoUrl(url) {
    if (url == null || url.indexOf("watch?v=") < 0) {
      return false;
    }

    return true;
  }

  static async getCurrentSortDirectionAsync() {
    /* eslint-disable no-undef */
    const sortDirection = (await GM.getValue(Utils.SortDirectionKey)) ?? "Ascending";
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
