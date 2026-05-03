export function removeElementById(id) {
  var element = document.getElementById(id);
  element.parentNode.removeChild(element);
}

export function getIdPortionOfVideoUrl(url) {
  return url.substring(url.indexOf("?v=") + 3);
}

export function getCurrentVideoUrl() {
  let url = window.location.href;

  if (!isVideoUrl(url)) {
    return null;
  }

  if (url.indexOf("&") > 0) {
    url = url.substring(0, url.indexOf("&"));
  }

  return url;
}

export function isVideoUrl(url) {
  if (url == null || url.indexOf("watch?v=") < 0) {
    return false;
  }

  return true;
}

export async function getCurrentSortDirectionAsync() {
  /* eslint-disable no-undef */
  const sortDirection = (await GM.getValue(SortDirection)) ?? "Ascending";
  /* eslint-enable no-undef */

  return sortDirection;
}

export async function setSortDirectionAsync(nextDirection) {
  /* eslint-disable no-undef */
  await GM.setValue(SortDirection, nextDirection);
  /* eslint-enable no-undef */
}
