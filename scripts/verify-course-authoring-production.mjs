import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const fromRoot = relative => fileURLToPath(new URL(`../${relative}`, import.meta.url));
const checks = [
  ['backend and domain tests', [fromRoot('node_modules/tsx/dist/cli.mjs'), '--test', 'src/server/**/*.test.ts', 'src/domain/**/*.test.ts']],
  ['frontend tests', [fromRoot('node_modules/tsx/dist/cli.mjs'), '--test', 'src/test/*.frontend.test.tsx']],
  ['TypeScript', [fromRoot('node_modules/typescript/bin/tsc'), '--noEmit']],
  ['quality audit', [fromRoot('scripts/quality-audit.mjs')]],
  ['frontend build', [fromRoot('node_modules/vite/bin/vite.js'), 'build']],
  ['server build', [fromRoot('node_modules/esbuild/bin/esbuild'), 'server.ts', '--bundle', '--platform=node', '--format=cjs', '--packages=external', '--sourcemap', '--outfile=dist/server.cjs']],
  ['Vercel API build', [fromRoot('node_modules/esbuild/bin/esbuild'), 'api/index.ts', '--bundle', '--platform=node', '--format=esm', '--packages=external', '--sourcemap', '--outfile=dist/api/index.mjs']],
  ['bundle budget', [fromRoot('scripts/check-bundle-budget.mjs')]],
  ['course authoring release', [fromRoot('scripts/verify-course-authoring-release.mjs')]],
];

for (const [label, args] of checks) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(process.execPath, args, { cwd: fromRoot('.'), stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`Production readiness gate stopped: ${label} failed.`);
    process.exit(result.status ?? 1);
  }
}
console.log('\nCourse authoring production readiness gate passed. Run the signed-in manual journeys in docs/COURSE_AUTHORING_RELEASE_CHECKLIST.md before deployment.');
