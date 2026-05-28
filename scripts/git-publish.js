const { execSync } = require('child_process');

try {
  console.log("Staging files...");
  execSync('git add .', { stdio: 'inherit' });

  console.log("Committing files...");
  const commitMsg = 'feat: update CI/CD pipeline with ESLint/Typecheck verification + push notification fixes';
  execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });

  console.log("Pushing to remote repo...");
  execSync('git push origin master', { stdio: 'inherit' });

  console.log("✅ Git publish successful!");
} catch (error) {
  console.error("❌ Git publish failed:", error.message);
  process.exit(1);
}
