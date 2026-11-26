async function checkJobs() {
  const res = await fetch('https://api.github.com/repos/Samarth-27/Swari/actions/runs/45668582163/jobs', {
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
