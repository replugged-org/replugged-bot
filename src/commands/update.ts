/* eslint-disable @typescript-eslint/no-explicit-any */
import { GuildTextableChannel, Message } from 'eris';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { GITHUB_RGX, UserFlags } from '../constants.js';
import { User as DBUser } from '../db.js';

export const description = 'Nope';

// Optional but recommended since requests will be rate limited to 60 per hour without a token
const token = process.env.GITHUB_TOKEN;

const ADDONS_FOLDER = ((): string => {
  let path: string;

  switch (process.platform) {
    case 'linux':
      path = '/var/lib/replugged-backend/addons';
      break;
    case 'win32':
      path = 'C:\\RepluggedData\\v';
      break;
    case 'darwin':
      path = `${process.env.HOME}/Library/Application Support/replugged-backend/addons`;
      break;
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }

  if (!existsSync(path)) {
    mkdirSync(path, {
      recursive: true,
    });
  }

  return path;
})();

const createDirForFile = (file: string): void => {
  const dir = path.dirname(file);
  if (existsSync(dir)) return;
  mkdirSync(dir, {
    recursive: true,
  });
};

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

  // eslint-disable-next-line prefer-const
  let [repoId, addonId] = args;

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
        const match = content.matchAll(GITHUB_RGX);
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
  const repoMatch = repoId.match(GITHUB_RGX);
  if (repoMatch) repoId = repoMatch[1];

  const res = await fetch(`https://api.github.com/repos/${repoId}/releases/latest`, {
    headers,
  });
  if (!res.ok) {
    console.error('Error getting release', await res.text()); // May have sensitive info so we won't share it in Discord
    msg.channel.createMessage('Error getting release');
    return;
  }
  const release = (await res.json()) as any;
  const manifestAssets = release.assets.filter((asset: any) => {
    if (addonId) {
      return asset.name === `${addonId}.json`;
    }

    return asset.name.endsWith('.json');
  });
  if (manifestAssets.length === 0) {
    msg.channel.createMessage('No manifest found');
    return;
  }
  if (manifestAssets.length > 1) {
    msg.channel.createMessage(
      `Multiple manifests found, please specify addon id. Found: ${manifestAssets
        .map((asset: any) => asset.name.replace(/\.json$/, ''))
        .join(', ')}`,
    );
    return;
  }
  const manifestAddonId = manifestAssets[0].name.replace(/\.json$/, '');
  const manifestUrl = manifestAssets[0].browser_download_url;
  const asarAsset = release.assets.find((asset: any) => asset.name === `${manifestAddonId}.asar`);
  if (!asarAsset) {
    msg.channel.createMessage(`No asar found for ${manifestAddonId}`);
    return;
  }
  const asarUrl = asarAsset.browser_download_url;

  const manifestRes = (await fetch(manifestUrl, {
    headers,
  }).then((res) => res.json())) as any;
  const { id, version } = manifestRes;
  manifestRes.updater = {
    type: 'store',
    id,
  };
  const asarRes = await fetch(asarUrl, {
    headers,
  }).then((res) => res.arrayBuffer());
  const manifestPath = path.join(ADDONS_FOLDER, 'manifests', `${manifestAddonId}.json`);
  const asarPath = path.join(ADDONS_FOLDER, 'asars', `${manifestAddonId}.asar`);
  [manifestPath, asarPath].forEach(createDirForFile);
  await writeFile(manifestPath, JSON.stringify(manifestRes, null, 2));
  await writeFile(asarPath, Buffer.from(asarRes));
  msg.channel.createMessage(`Added/updated ${id} (${version}).`);
}
