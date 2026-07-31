export function isGoogleDriveFileUrl(input: string): boolean {
  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || (host !== 'drive.google.com' && host !== 'docs.google.com')) return false;

    const fileId = url.pathname.match(/\/file\/d\/([\w-]{20,})/)?.[1] || url.searchParams.get('id');
    return Boolean(fileId && /^[\w-]{20,}$/.test(fileId));
  } catch {
    return false;
  }
}
