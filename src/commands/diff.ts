/* eslint-disable @typescript-eslint/no-explicit-any */
import { GuildTextableChannel, Message } from 'eris';
import { UserFlags } from '../constants.js';
import { User as DBUser } from '../db.js';

export const description = 'Nope';

// Optional but recommended since requests will be rate limited to 60 per hour without a token
const token = process.env.GITHUB_TOKEN;

export async function executor(msg: Message<GuildTextableChannel>, args: string[]) {
  const client = msg._client;
  const dbCollection = client.mango.collection<DBUser>('users');
  const dbAuthor = await dbCollection.findOne({ _id: msg.author.id });
  if (!dbAuthor || (dbAuthor.flags & UserFlags.STAFF) === 0)
    return msg.channel.createMessage('nope');

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const [repoId] = args;

  if (!repoId) {
    msg.channel.createMessage(`Usage: ${process.env.PREFIX}diff <user/repo>`);
    return;
  }

  const res = await fetch(`https://api.github.com/repos/${repoId}/tags`, {
    headers,
  });
  if (!res.ok) {
    console.error('Error getting tags', await res.text()); // May have sensitive info so we won't share it in Discord
    msg.channel.createMessage('Error getting tags');
    return;
  }

  const json = await res.json();
  const latest = json[0];
  if (!latest) {
    msg.channel.createMessage('No tags found');
    return;
  }
  const latestCommit = latest.commit.sha;
  const latestVersion = latest.name;

  const second = json[1];
  if (!second) {
    msg.channel.createMessage('No second tag found');
    return;
  }
  const secondCommit = second.commit.sha;
  const secondVersion = second.name;

  const diffUrl = `https://github.com/${repoId}/compare/${secondCommit}...${latestCommit}`;
  msg.channel.createMessage(`Update from ${secondVersion} to ${latestVersion}: ${diffUrl}`);
}
