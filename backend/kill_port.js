import { execSync } from 'child_process';

const port = 3000;
try {
  const result = execSync(`netstat -ano | findstr :${port}`).toString().trim();
  const lines = result.split('\n');
  lines.forEach(line => {
    const parts = line.split(/\s+/).filter(Boolean);
    const pid = parts[parts.length - 1];
    if (pid && pid !== '0') {
      try {
        console.log(`Killing process ${pid} on port ${port}...`);
        execSync(`taskkill /f /pid ${pid}`);
      } catch (e) {
        // ignore
      }
    }
  });
} catch (e) {
  console.log(`No process found on port ${port}.`);
}
