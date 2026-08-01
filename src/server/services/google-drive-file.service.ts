export function parseGoogleDriveFileId(input: string): string {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error('Enter a valid Google Drive file URL.');
  }

  if (url.protocol !== 'https:' || !['drive.google.com', 'docs.google.com'].includes(url.hostname.toLowerCase())) {
    throw new Error('Use an HTTPS Google Drive file link.');
  }
  if (/\/(?:drive\/)?folders\//.test(url.pathname)) {
    throw new Error('Select a PDF file, not a Google Drive folder.');
  }

  const fileId = url.pathname.match(/\/file\/d\/([\w-]{20,})/)?.[1] || url.searchParams.get('id');
  if (!fileId || !/^[\w-]{20,}$/.test(fileId)) {
    throw new Error('Use a Google Drive file share link.');
  }
  return fileId;
}
