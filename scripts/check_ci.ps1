$runsUrl = "https://api.github.com/repos/maazulhaque26-ship-it/Halal-Pizza-Fun/actions/runs?per_page=1"
$runsResp = Invoke-WebRequest -Uri $runsUrl -UseBasicParsing -TimeoutSec 30
$run = ($runsResp.Content | ConvertFrom-Json).workflow_runs[0]

$jobsResp = Invoke-WebRequest -Uri $run.jobs_url -UseBasicParsing -TimeoutSec 30
$job = ($jobsResp.Content | ConvertFrom-Json).jobs[0]

Write-Host "Fetching logs for job $($job.id)..."

$logsUrl = "https://api.github.com/repos/maazulhaque26-ship-it/Halal-Pizza-Fun/actions/jobs/$($job.id)/logs"
try {
    $logsResp = Invoke-WebRequest -Uri $logsUrl -UseBasicParsing -TimeoutSec 30
    $lines = $logsResp.Content -split "`n"
    # Get last 80 lines which should contain the build error
    $tail = $lines | Select-Object -Last 80
    foreach ($line in $tail) {
        Write-Host $line
    }
} catch {
    Write-Host "Could not fetch logs directly. Status: $($_.Exception.Response.StatusCode)"
    Write-Host "The API may require authentication for logs."
    Write-Host ""
    Write-Host "Job ID: $($job.id)"
    Write-Host "Run ID: $($run.id)"
}
