# Slack Notify Action

A GitHub Action that sends a job (or whole-workflow) status notification to Slack via an Incoming Webhook.

## Inputs

| Name                | Required | Default | Description                                                                                  |
| ------------------- | -------- | ------- | -------------------------------------------------------------------------------------------- |
| `job_name`          | yes      | —       | The name of the job, e.g. `Test` or `Deploy`. Accepts a comma-separated list (see below).    |
| `job_status`        | yes      | —       | The status of the job, e.g. `${{ job.status }}`. Accepts a comma-separated list (see below). |
| `slack_webhook_url` | yes      | —       | The Slack Incoming Webhook URL to send the notification to.                                   |
| `show_commit`       | no       | `false` | When `true`, appends the head commit message and author to the message. Off reduces spam.    |

## Outputs

None.

## Example usage

Pin to the major version tag (`@v5`):

```yaml
- uses: jcoene/slack-notify-action@v5
  if: always()
  with:
    job_name: 'Test'
    job_status: '${{ job.status }}'
    slack_webhook_url: '${{ secrets.SLACK_WEBHOOK_URL }}'
    show_commit: 'true'
```

### Reporting on multiple jobs

`job_name` and `job_status` accept comma-separated lists of equal length. The action
collapses them into a single message:

- If any job failed, the message reports a **failure**.
- Otherwise, if any job was cancelled, it reports **cancelled**.
- Otherwise it reports **success**.

When exactly one job matches the reported status its name is used; otherwise the message
is labeled `workflow`.

```yaml
- uses: jcoene/slack-notify-action@v5
  if: always()
  with:
    job_name: 'Test, Deploy, Lint'
    job_status: '${{ needs.test.result }}, ${{ needs.deploy.result }}, ${{ needs.lint.result }}'
    slack_webhook_url: '${{ secrets.SLACK_WEBHOOK_URL }}'
```

## Development

Requires Node 24 (see `.tool-versions`).

```bash
npm install        # install dependencies
npm run typecheck  # type-check with tsc
npm run format     # format with prettier
npm run build      # bundle src/ into dist/ with ncc
npm test           # typecheck + format check
```

The bundled output in `dist/` is committed and is what GitHub runs. **Always run
`npm run build` and commit `dist/` when changing anything in `src/`** — CI fails if
`dist/` is out of date.
