async function checkJobs() {
  const runsRes = await fetch('https://api.github.com/repos/Samarth-27/Swari/actions/runs?per_page=3', {
    headers: { 'User-Agent': 'Antigravity-CI-Checker' }
  });
  const runsData = await runsRes.json();
  const latestRun = runsData.workflow_runs?.[0];
  if (!latestRun) {
    console.log('No workflow runs found.');
    return;
  }
  console.log(`Latest Run: ${latestRun.id} | Commit: ${latestRun.head_sha.slice(0, 7)} | Status: ${latestRun.status} | Conclusion: ${latestRun.conclusion}`);
  console.log(`Title: ${latestRun.display_title}\n`);

  const res = await fetch(`https://api.github.com/repos/Samarth-27/Swari/actions/runs/${latestRun.id}/jobs`, {
    headers: { 'User-Agent': 'Antigravity-CI-Checker' }
  });
  const data = await res.json();
  console.log('Total jobs:', data.total_count);
  for (const job of data.jobs) {
    console.log(`\nJob: "${job.name}" [${job.conclusion || job.status}]`);
    if (job.steps) {
      for (const step of job.steps) {
        console.log(`  - ${step.name}: ${step.conclusion || step.status}`);
      }
    }
  }
}
checkJobs().catch(console.error);
