import { env } from '../config/env';

export const mailboxEnabled = Boolean(env.mailosaur.apiKey && env.mailosaur.serverId);

/** Unique address per run. Uses Mailosaur when configured so emails can be read back. */
export function testEmail(tag: string): string {
  return mailboxEnabled
    ? `${tag}-${env.runId}@${env.mailosaur.serverId}.mailosaur.net`
    : `qa.test+${tag}-${env.runId}@example.com`;
}

export interface ReceivedEmail {
  subject: string;
  text: string;
  html: string;
}

/** Waits for an email to arrive at `sentTo` via the Mailosaur REST API. */
export async function waitForEmail(sentTo: string, timeoutMs = 120_000): Promise<ReceivedEmail> {
  if (!mailboxEnabled) throw new Error('Mailosaur is not configured (MAILOSAUR_API_KEY / MAILOSAUR_SERVER_ID).');
  const url =
    `https://mailosaur.com/api/messages/await?server=${encodeURIComponent(env.mailosaur.serverId)}` +
    `&timeout=${timeoutMs}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${env.mailosaur.apiKey}:`).toString('base64'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sentTo }),
  });
  if (!res.ok) throw new Error(`No email for ${sentTo} within ${timeoutMs} ms (Mailosaur ${res.status}).`);
  const msg = (await res.json()) as { subject?: string; text?: { body?: string }; html?: { body?: string } };
  return { subject: msg.subject ?? '', text: msg.text?.body ?? '', html: msg.html?.body ?? '' };
}
