import { getDriveClient } from './src/server/config/google';
try {
  getDriveClient();
  console.log("SUCCESS");
} catch(e) {
  console.error("FAIL:", e);
}
