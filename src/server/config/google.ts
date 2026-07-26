import { google, drive_v3 } from 'googleapis';

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
    // Try parsing as raw JSON
    credentials = JSON.parse(credentialsJson);
  } catch (e) {
    try {
      // Fallback: try base64 decoding
      const decoded = Buffer.from(credentialsJson, 'base64').toString('utf8');
      credentials = JSON.parse(decoded);
    } catch (base64Error) {
      console.error('[GoogleConfig] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON as JSON or base64');
      throw new Error('Invalid Google Service Account configuration');
    }
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

