# Slack Notify Action

This action send a job status notification to Slack.

## Inputs

### `job_name`

**Required** The name of the job, ex. `"Test"` or `"Deploy"`

### `job_status`

**Required** The status of the job, ex. `${{ job.status }}`

### `slack_webhook_url`

**Required** The Slack Webhook URL to send the notification

## Outputs

None

## Example usage

uses: jcoene/slack-notify-action@master
with:
  job_name: "Test"
  job_status: "${{ job.status }}"
  slack_webhook_url: "${{ secrets.SLACK_WEBHOOK_URL }}

