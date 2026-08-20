import { google, drive_v3, searchconsole_v1 } from 'googleapis';

/** Shared by every service-account client below: try raw JSON first, then base64-decoded JSON (Vercel env vars are sometimes stored base64-encoded to survive dashboard escaping). */
function parseGoogleCredentials(rawJson: string): Record<string, unknown> {
  try {
    return JSON.parse(rawJson);
  } catch (e) {
    const decoded = Buffer.from(rawJson, 'base64').toString('utf8');
    return JSON.parse(decoded);
  }
}

let driveClient: drive_v3.Drive | null = null;

export const getDriveClient = (): drive_v3.Drive => {
  if (driveClient) {
    return driveClient;
  }

  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!credentialsJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not configured');
  }

  let credentials;
  try {
    credentials = parseGoogleCredentials(credentialsJson);
  } catch (e) {
    console.error('[GoogleConfig] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON as JSON or base64');
    throw new Error('Invalid Google Service Account configuration');
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    driveClient = google.drive({ version: 'v3', auth });
    return driveClient;
  } catch (error) {
    console.error('[GoogleConfig] Failed to initialize Google Drive client:', error);
    throw new Error('Failed to initialize Google Drive client due to invalid configuration');
  }
};

let searchConsoleClient: searchconsole_v1.Searchconsole | null = null;

/**
 * Uses its own service account (GOOGLE_SEARCH_CONSOLE_CREDENTIALS), separate from the
 * Drive one above -- Search Console access was granted to a dedicated service account
 * with "Restricted" (read-only) permission on the tutiba.com property, so it shouldn't
 * share credentials/scopes with the Drive integration.
 */
export const getSearchConsoleClient = (): searchconsole_v1.Searchconsole => {
  if (searchConsoleClient) {
    return searchConsoleClient;
  }

  const credentialsJson = process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS;

  if (!credentialsJson) {
    throw new Error('GOOGLE_SEARCH_CONSOLE_CREDENTIALS environment variable is not configured');
  }

  let credentials;
  try {
    credentials = parseGoogleCredentials(credentialsJson);
  } catch (e) {
    console.error('[GoogleConfig] Failed to parse GOOGLE_SEARCH_CONSOLE_CREDENTIALS as JSON or base64');
    throw new Error('Invalid Google Search Console service account configuration');
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    searchConsoleClient = google.searchconsole({ version: 'v1', auth });
    return searchConsoleClient;
  } catch (error) {
    console.error('[GoogleConfig] Failed to initialize Search Console client:', error);
    throw new Error('Failed to initialize Search Console client due to invalid configuration');
  }
};

