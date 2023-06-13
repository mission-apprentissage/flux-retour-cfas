/**
 * Force the browser to download a file
 */
export function downloadObject(object: any, filename: string, type: string) {
  const blob = new Blob([object], {
    type,
  });
  downloadFile(URL.createObjectURL(blob), filename);
}

/**
 * Create an html element to save a file
 */
function downloadFile(url: string, filename: string) {
  const link = document.createElement("a");
  document.body.appendChild(link);
  link.type = "hidden";
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
