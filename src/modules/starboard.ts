import type {
  CommandClient,
  EmbedImage,
  EmbedVideo,
  PartialEmoji,
  GuildTextableChannel,
  Message,
  User
} from 'eris';
import { IDS } from '../constants.js';

type StarboardEntry = {
  _id: string,
  messageId: string,
  stars: number
};

type BoardDecoration = Array<[ number, string, number ]>;
type HasId = { id: string };

const BOARD_MINIMUM = 3;
const STARBOARD_EMOTE = '⭐';
const GENERIC_STAR_OBJ = {messageId: '', stars: 0};

const EMOTES: BoardDecoration = [
  [ 0, '⭐', 0xffffff ],
  [ 5, '🌟', 0xffffaa ],
  [ 10, '💫', 0xffff66 ],
  [ 20, '✨', 0xffff00 ],
];

function isProcessable(msg: Message<GuildTextableChannel>): boolean {
  return !msg.channel.nsfw
        && msg.channel.id !== IDS.channels.starboard
        && !(msg.content.length === 0 && msg.attachments.length === 0 && (!msg.embeds[0] || msg.embeds[0].type !== 'image'));
}

async function getAllReactions(msg: Message<GuildTextableChannel>, reaction: string): Promise<User[]> {
  const reactions = [];
  let batch: User[] = [];

  do {
    batch = await msg.getReaction(reaction, {limit: 100, after: batch[0]?.id});
    reactions.push(...batch);
  } while(batch.length === 100);

  return reactions;
}

function extractMedia(msg: Message<GuildTextableChannel>): {image?: EmbedImage; video?: EmbedVideo} {
  if(msg.attachments.length > 0 && msg.attachments[0].width) {
    return { image: msg.attachments[0] };
  }
  else if(msg.embeds.length > 0 && msg.embeds[0].type === 'image') {
    return {image: msg.embeds[0].image || msg.embeds[0].thumbnail};
  }

  return {};
}

function generateMessage(stars: number, msg: Message<GuildTextableChannel>) {
  const [, star, color] = EMOTES.filter((e) => e[0] <= stars).pop()!;

  return {
    content: `${star} **${stars}** - <#${msg.channel.id}>`,
    embed: {
      ...extractMedia(msg),
      color,
      author: {
        name: `${msg.author.username}#${msg.author.discriminator}`,
        icon_url: msg.author.avatarURL
      },
      description: msg.content,
      fields: [
        {
          name: 'Jump to message',
          value: `[Click here](https://discord.com/channels/${msg.channel.guild.id}/${msg.channel.id}/${msg.id})`
        }
      ]
    }
  };
}

async function updateStarCount(msg: Message<GuildTextableChannel>, count: number): Promise<void> {
  if(!msg.author) msg = await msg.channel.getMessage(msg.id);

  const channel = IDS.channels.starboard;
  const entry = await msg._client.mango.collection<StarboardEntry>('starboard').findOne({_id: msg.id}) || { ...GENERIC_STAR_OBJ };
  entry.stars = count;

  if(entry.stars < BOARD_MINIMUM) {
    if(entry.messageId) {
      msg._client.mango.collection<StarboardEntry>('starboard').deleteOne({_id: msg.id});
      msg._client.deleteMessage(channel, entry.messageId);
    }
    return;
  }

  if(!entry.messageId) {
    const starMsg = await msg._client.createMessage(channel, generateMessage(entry.stars, msg));
    entry.messageId = starMsg.id;
  }
  else {
    msg._client.editMessage(channel, entry.messageId, generateMessage(entry.stars, msg));
  }

  msg._client.mango.collection<StarboardEntry>('starboard').updateOne(
    {_id: msg.id},
    {$set: {...entry}},
    {upsert: true}
  );
}

async function process(msg: Message<GuildTextableChannel>, emoji: PartialEmoji, user: HasId): Promise<void> {
  if(emoji.name !== STARBOARD_EMOTE) return;

  if(!msg.author) msg = await msg.channel.getMessage(msg.id);

  if(msg.author.id === user.id) {
    msg.channel.removeMessageReaction(msg.id, emoji.name, user.id);
    return;
  }

  const filter = (u: User) => u.id !== msg.author.id;

  if(emoji.name === STARBOARD_EMOTE && isProcessable(msg)) {
    const reactions = await getAllReactions(msg, STARBOARD_EMOTE);
    updateStarCount(msg, reactions.filter(filter).length);
  }
}

export default function (bot: CommandClient): void {
  bot.on('messageReactionAdd', (msg, emoji, user) => process(msg as Message<GuildTextableChannel>, emoji as PartialEmoji, user as HasId));
  bot.on('messageReactionRemove', (msg, emoji, user) => process(msg as Message<GuildTextableChannel>, emoji as PartialEmoji, { id: user } as HasId));
  bot.on('messageReactionRemoveAll', (msg) => updateStarCount(msg as Message<GuildTextableChannel>, 0));
  bot.on('messageDelete', (msg) => updateStarCount(msg as Message<GuildTextableChannel>, 0));
}