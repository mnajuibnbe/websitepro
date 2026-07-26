import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getMissingServerEnvironmentVariables,
  validateServerEnvironment,
} from './environment.js';

test('reports a missing required environment variable', () => {
  const environment = {
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    STREAMING_TOKEN_SECRET: '',
    GOOGLE_SERVICE_ACCOUNT_JSON: '{}',
  } as NodeJS.ProcessEnv;

  assert.deepEqual(getMissingServerEnvironmentVariables(environment), ['STREAMING_TOKEN_SECRET']);
  assert.throws(
    () => validateServerEnvironment(environment),
    /Missing required server environment variables: STREAMING_TOKEN_SECRET/,
  );
});
