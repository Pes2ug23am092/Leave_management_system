const { spawnSync } = require('child_process');

function runESLint() {
  // Run eslint with JSON formatter
  const res = spawnSync('npx', ['eslint', '.', '--ext', '.js', '-f', 'json'], { encoding: 'utf8' });
  if (res.error) {
    console.error('Failed to run eslint:', res.error);
    process.exit(2);
  }

  const out = res.stdout || '[]';
  let results = [];
  try {
    results = JSON.parse(out);
  } catch (e) {
    console.error('ESLint did not return JSON output.');
    console.log(out);
    process.exit(2);
  }

  let errorCount = 0;
  let warningCount = 0;
  results.forEach(r => {
    errorCount += r.errorCount || 0;
    warningCount += r.warningCount || 0;
  });

  // Simple scoring: start at 10, subtract penalties
  const penalty = errorCount * 1.5 + warningCount * 0.3;
  const score = Math.max(0, Math.round((10 - penalty) * 100) / 100);

  console.log(`ESLint results: errors=${errorCount}, warnings=${warningCount}, score=${score}/10`);

  const threshold = 7.5;
  if (score < threshold) {
    console.error(`Lint score ${score} is below threshold ${threshold}. Failing.`);
    process.exit(1);
  }

  process.exit(0);
}

runESLint();
