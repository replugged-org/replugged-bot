/* eslint-disable @typescript-eslint/no-explicit-any */
import { GuildTextableChannel, GuildTextChannelTypes, Message } from 'eris';
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

  let [repoId] = args;

  let errorMsg = `Usage: ${process.env.PREFIX}diff <user/repo>`;
  if (!repoId) {
    // Try to extract repo from the original message

    // @ts-expect-error Eris is dumb
    const threadType: GuildTextChannelTypes = 11; // PUBLIC_THREAD
    if (msg.channel.type === threadType) {
      const firstMessageId = msg.channel.id;
      const firstMessage = await msg.channel.getMessage(firstMessageId);
      if (firstMessage) {
        const content = firstMessage.content || '';
        const match = content.matchAll(/https?:\/\/github\.com\/([^/\s]+\/[^/\s]+)/g);
        const matches = [...match];
        if (matches.length === 1) {
          repoId = matches[0][1];
        }
        if (matches.length > 1) {
          errorMsg = 'Multiple repos found in thread, must specify';
        }
      }
    }
  }
  if (!repoId) {
    msg.channel.createMessage(errorMsg);
    return;
  }

  const releasesRes = await fetch(`https://api.github.com/repos/${repoId}/releases`, {
    headers,
  });
  if (!releasesRes.ok) {
    console.error('Error getting release', await releasesRes.text()); // May have sensitive info so we won't share it in Discord
    msg.channel.createMessage('Error getting release');
    return;
  }
  const releases = (await releasesRes.json()).sort((a: any, b: any) => {
    const aDate = new Date(a.published_at);
    const bDate = new Date(b.published_at);
    return bDate.getTime() - aDate.getTime();
  }) as any;
  const firstRelease = releases[0];
  if (!firstRelease) {
    msg.channel.createMessage('No releases found');
    return;
  }
  const firstReleaseName = firstRelease.name;
  const firstReleaseTag = firstRelease.tag_name;
  const secondRelease = releases[1];
  if (!secondRelease) {
    msg.channel.createMessage('No second release found');
    return;
  }
  const secondReleaseName = secondRelease.name;
  const secondReleaseTag = secondRelease.tag_name;

  const tagsRes = await fetch(`https://api.github.com/repos/${repoId}/tags`, {
    headers,
  });
  if (!tagsRes.ok) {
    console.error('Error getting tags', await tagsRes.text()); // May have sensitive info so we won't share it in Discord
    msg.channel.createMessage('Error getting tags');
    return;
  }

  const json = await tagsRes.json();
  const firstTag = json.find((tag: any) => tag.name === firstReleaseTag);
  if (!firstTag) {
    msg.channel.createMessage(
      `Could not find tag ${firstReleaseTag} for release ${firstReleaseName}`,
    );
    return;
  }
  const firstCommit = firstTag.commit.sha;
  const secondTag = json.find((tag: any) => tag.name === secondReleaseTag);
  if (!secondTag) {
    msg.channel.createMessage(
      `Could not find tag ${secondReleaseTag} for release ${secondReleaseName}`,
    );
    return;
  }
  const secondCommit = secondTag.commit.sha;

  const diffUrl = `https://github.com/${repoId}/compare/${secondCommit}...${firstCommit}`;
  msg.channel.createMessage(
    `Update from ${secondReleaseName} to ${firstReleaseName}: <${diffUrl}>`,
  );
}
