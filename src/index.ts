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

function buildPayload(rawName: string, rawStatus: string): IncomingWebhookSendArguments {
  const jobNames = rawName.split(',').map(s => s.trim());
  const jobStatuses = rawStatus.split(',').map(s => s.trim());

  let jobName = jobNames[0];
  let jobStatus = jobStatuses[0];
  if (jobNames.length > 1 && jobNames.length === jobStatuses.length) {
    const succeeded = jobNames.filter((_, i) => jobStatuses[i] === 'success');
    const failed = jobNames.filter((_, i) => jobStatuses[i] === 'failure');
    const cancelled = jobNames.filter((_, i) => jobStatuses[i] === 'cancelled');

    if (failed.length > 0) {
      jobName = failed.length === 1 ? failed[0] : 'workflow';
      jobStatus = 'failure';
    } else if (cancelled.length > 0) {
      jobName = cancelled.length === 1 ? cancelled[0] : 'workflow';
      jobStatus = 'cancelled';
    } else {
      jobName = succeeded.length === 1 ? succeeded[0] : 'workflow';
      jobStatus = 'success';
    }
  }

  const label = statusToLabel(jobStatus);
  const repo = `${github.context.repo.owner}/${github.context.repo.repo}`;
  const repoUrl = `https://github.com/${repo}`;

  const runLabel = jobName;
  const runUrl = github.context.runId ? `${repoUrl}/actions/runs/${github.context.runId}` : '';

  const commitLabel = github.context.sha?.slice(0, 8) || '???????';
  const commitUrl = github.context.sha ? `${repoUrl}/commit/${github.context.sha}` : '';

  const actor = github.context.actor || 'unknown';

  const ref = github.context.ref?.replace(/refs\/.+?\//, '') || '';
  const refLabel = ref;
  const refUrl = `${repoUrl}/tree/${ref}`;

  const commit = payloadToCommit(github.context.payload);

  // prettier-ignore
  const title = [
    `${label}:`,
    `${actor}'s`,
    `<${runUrl}|${runLabel}>`,
    `(<${commitUrl}|${commitLabel}>)`,
    `in`,
    `<${repoUrl}|${repo}>`,
    `(<${refUrl}|${refLabel}>)`,
  ].join(' ');

  const text = [title, commit].filter(v => !!v).join('\n');

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

function payloadToCommit(payload?: any): string {
  const commit = payload?.head_commit;
  if (!commit || !commit.id || !commit.url) {
    return '';
  }

  const author = commit.author?.username || commit.committer?.username || 'unknown';

  return `- ${commit.message} (<${commit.url}|${commit.id.slice(0, 8)}> by ${author})`;
}

function statusToLabel(jobStatus: string): string {
  return jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1);
}

function statusToColor(jobStatus: string): string {
  return statusColors[jobStatus] || '';
}
