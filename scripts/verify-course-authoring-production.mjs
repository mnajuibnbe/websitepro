import { spawnSync } from 'node:child_process';

const checks = [
  ['npm', ['test']],
  ['npm', ['run', 'test:frontend']],
  ['npm', ['run', 'lint']],
  ['npm', ['run', 'test:quality']],
  ['npm', ['run', 'build:check']],
  ['npm', ['run', 'test:course-authoring-release']],
];

for (const [command, args] of checks) {
  console.log(`\n=== ${command} ${args.join(' ')} ===`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`Production readiness gate stopped: ${command} ${args.join(' ')} failed.`);
    process.exit(result.status ?? 1);
  }
}
console.log('\nCourse authoring production readiness gate passed. Run the staging SQL and manual journeys in docs/COURSE_AUTHORING_RELEASE_CHECKLIST.md before deployment.');
