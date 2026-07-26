import { getDriveClient } from './src/server/config/google';

async function test() {
  const drive = getDriveClient();
  try {
    const res = await drive.files.get(
      { fileId: '1a2b3c4d5e', alt: 'media' },
      { responseType: 'stream', headers: { Range: 'bytes=0-100' } } as any
    );
    console.log("OK");
  } catch (err: any) {
    console.log("ERROR MESSAGE:", err.message);
  }
}
test();
