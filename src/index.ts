import * as core from '@actions/core';
import * as github from '@actions/github';
import { IncomingWebhook, IncomingWebhookDefaultArguments, IncomingWebhookSendArguments } from '@slack/webhook';

const statusColors = {
  success: 'good',
  failure: 'danger',
  cancelled: 'warning',
};

try {
  const jobName = core.getInput('job_name', { required: true });
  const jobStatus = core.getInput('job_status', { required: true });
  const slackWebhookUrl = core.getInput('slack_webhook_url', {
    required: true,
  });

  // Build payload
  const payload = buildPayload(jobName, jobStatus);
  console.log('Payload:', JSON.stringify(payload));

  // Build client
  const options: IncomingWebhookDefaultArguments = {};
  const client = new IncomingWebhook(slackWebhookUrl, options);

  client.send(payload).then(res => {
    if (res.text !== 'ok') {
      throw new Error(`Failed to send notification to Slack: ${res.text}`);
    }
    console.log('ok!');
  });
} catch (error: any) {
  core.setFailed(error.message);
}

function buildPayload(jobName: string, jobStatus: string): IncomingWebhookSendArguments {
  const label = statusToLabel(jobStatus);
  const repo = `${github.context.repo.owner}/${github.context.repo.repo}`;
  const repoUrl = `https://github.com/${repo}`;

  const runLabel = jobName;
  const runUrl = github.context.runId ? `${repoUrl}/runs/${github.context.runId}` : '';

  const commitLabel = github.context.sha?.slice(0, 8) || '???????';
  const commitUrl = github.context.sha ? `${repoUrl}/commits/${github.context.sha}` : '';

  const actor = github.context.actor || 'unknown';

  const ref = github.context.ref?.replace(/refs\/.+?\//, '') || '';
  const refLabel = ref;
  const refUrl = `${repoUrl}/tree/${ref}`;

  console.log('ENV:', JSON.stringify(process.env));
  console.log('github.context:', JSON.stringify(github.context));

  // prettier-ignore
  const text = [
    `${label}:`,
    `${actor}'s`,
    `<${runUrl}|${runLabel}>`,
    `(<${commitUrl}|${commitLabel}>)`,
    `in`,
    `<${repoUrl}|${repo}>`,
    `(<${refUrl}|${refLabel}>)`,
  ].join(' ');

  return {
    attachments: [
      {
        color: statusToColor(jobStatus),
        text: text,
        footer: repo,
      },
    ],
  };
}

function statusToLabel(jobStatus: string): string {
  return jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1);
}

function statusToColor(jobStatus: string): string {
  return statusColors[jobStatus] || '';
}
