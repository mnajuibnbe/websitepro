import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import test from 'node:test';

const host = '127.0.0.1';
const port = 4178;
const origin = `http://${host}:${port}`;

async function waitForPreview(process) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (process.exitCode !== null) throw new Error(`Vite preview exited with code ${process.exitCode}`);
    try {
      const response = await fetch(origin);
      if (response.ok) return response;
    } catch {
      // The preview server is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Timed out waiting for Vite preview');
}

test('serves the prerendered homepage and its browser bundle', async t => {
  const preview = spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', 'preview', '--host', host, '--port', String(port), '--strictPort'],
    { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let diagnostics = '';
  preview.stdout.on('data', chunk => { diagnostics += chunk; });
  preview.stderr.on('data', chunk => { diagnostics += chunk; });
  t.after(() => preview.kill('SIGTERM'));

  const response = await waitForPreview(preview).catch(error => {
    throw new Error(`${error.message}\n${diagnostics}`);
  });
  const html = await response.text();

  assert.match(response.headers.get('content-type') ?? '', /text\/html/);
  // scripts/prerender.mjs bakes real, crawler-facing homepage markup into
  // dist/index.html at build time (not the empty CSR shell), and fails the
  // build if a route's snapshot is the app's own error boundary instead of
  // real content — assert both properties here so a regression in either
  // shows up as a test failure instead of a silently broken production page.
  assert.doesNotMatch(html, /<div id="root"><\/div>/, 'homepage should ship prerendered content, not an empty CSR shell');
  assert.doesNotMatch(html, /data-app-error-boundary="true"/, 'homepage snapshot should not be the app error boundary fallback');
  assert.match(html, /<div id="root">\s*<div/, 'homepage should contain real prerendered markup inside #root');

  const scriptPath = html.match(/<script[^>]+src="([^"]+)"/)?.[1];
  assert.ok(scriptPath, 'production HTML should reference a browser entry bundle');

  const bundleResponse = await fetch(new URL(scriptPath, origin));
  assert.equal(bundleResponse.status, 200);
  assert.match(bundleResponse.headers.get('content-type') ?? '', /javascript/);
  assert.ok((await bundleResponse.text()).length > 1_000, 'browser entry bundle should not be empty');
});
