export const REQUIRED_SERVER_ENVIRONMENT_VARIABLES = [
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STREAMING_TOKEN_SECRET',
  'GOOGLE_SERVICE_ACCOUNT_JSON',
] as const;

export function getMissingServerEnvironmentVariables(
  environment: NodeJS.ProcessEnv = process.env,
): string[] {
  return REQUIRED_SERVER_ENVIRONMENT_VARIABLES.filter((name) => !environment[name]?.trim());
}

export function validateServerEnvironment(environment: NodeJS.ProcessEnv = process.env): void {
  const missing = getMissingServerEnvironmentVariables(environment);
  if (missing.length > 0) {
    throw new Error(`Missing required server environment variables: ${missing.join(', ')}`);
  }
}
