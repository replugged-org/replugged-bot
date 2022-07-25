import type {
  CommandClient,
  Message,
  GuildTextableChannel,
  TextableChannel,
  OldMessage,
  User,
  TextChannel
} from 'eris';

type PossiblyUncachedMessage = Message<GuildTextableChannel> | { channel: TextableChannel | { id: string; guild: { id: string } }; guildID: string; id: string };
type MessageLike = { id: string; author: User; channel: { name: string }; content: string };

type SnipeRecord = { author: string; msg: string; channel: string; type: 'edit' | 'delete' };

export const skipSnipe = new Set<string>();

export const SNIPE_LIFETIME = 20;
const ZWS = '\u200B';
const buffer = new Map<number, SnipeRecord>();

function isPrivate (channel: TextChannel) {
  return Boolean((channel.permissionOverwrites.get(channel.guild.id)?.deny ?? 0n) & 1024n);
}

async function store(msg: MessageLike, type: 'edit' | 'delete') {
  const id = Math.random();
  buffer.set(id, {
    author: `${msg.author.username}#${msg.author.discriminator}`,
    msg: msg.content ? msg.content.replace(/\(/g, `${ZWS}(`) : 'This message had no text content.',
    channel: msg.channel.name,
    type: type
  });

  setTimeout(() => buffer.delete(id), SNIPE_LIFETIME * 1e3);
}

function processEdit(msg: Message<GuildTextableChannel>, old: OldMessage | null) {
  if (!old || 
    !msg.author || 
    msg.channel.guild.id !== process.env['SERVER_ID'] || 
    msg.author.bot || msg.content === old.content || 
    isPrivate(msg.channel as TextChannel /* There is no reason for this to not be a text channel */)
  ) {
    return; // Ignore
  }
    

  store({...msg, content: old.content}, 'edit');
}

function processDelete(msg: PossiblyUncachedMessage) {
  if (!('author' in msg) || 
  msg.channel.guild.id !== process.env['SERVER_ID'] || 
  msg.author.bot || 
  isPrivate(msg.channel as TextChannel /* There is no reason for this to not be a text channel */) || 
  skipSnipe.has(msg.id)
  ) {
    skipSnipe.delete(msg.id);
    return;
  }

  store(msg, 'delete');
}

export function getLastMessages() {
  const res = Array.from(buffer.values());
  buffer.clear();
  return res;
}

export default function (bot: CommandClient) {
  bot.on('messageUpdate', processEdit);
  bot.on('messageDelete', processDelete);
}