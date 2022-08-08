import type { GuildTextableChannel, Message } from 'eris';
import { UserFlags } from '../constants';
import type { DatabaseTag } from '../db';
import { User as DBUser } from '../db.js';

async function listTags (msg: Message<GuildTextableChannel>): Promise<void> {
  const tags: DatabaseTag[] = await msg._client.mango.collection<DatabaseTag>('tags').find({}).toArray();
  if(tags.length === 0) {
    msg.channel.createMessage('No existing tags.');
    return;
  }
  msg.channel.createMessage(`Available tags: \`${tags.map((t) => t._id).join('`, `')}\``);
}

async function addTag(msg: Message<GuildTextableChannel>, args: string[]): Promise<void> {
  if(['list', 'add', 'edit', 'delete'].includes(args[1])) {
    msg.channel.createMessage('pls no');
    return;
  }

  if(await msg._client.mango.collection<DatabaseTag>('tags').findOne({_id: args[1].toLowerCase()})) {
    msg.channel.createMessage('This tag already exists.');
    return;
  }
  
  await msg._client.mango.collection<DatabaseTag>('tags').insertOne({_id: args[1].toLowerCase(), content: msg.content.split(' ').slice(3).join(' ') });
  msg.channel.createMessage(`Created tag: ${args[1].toLowerCase()}`);
}

async function editTag(msg: Message<GuildTextableChannel>, args: string[]): Promise<void> {
  if(!args[1]) {
    msg.channel.createMessage('Include a tag silly goose');
    return;
  }
  if(!await msg._client.mango.collection<DatabaseTag>('tags').findOne({_id: args[1].toLowerCase()})) {
    msg.channel.createMessage(`Tag \`${args[1].toLowerCase()}\` does not exist!`);
    return;
  }

  await msg._client.mango.collection<DatabaseTag>('tags').updateOne({_id: args[1].toLowerCase}, {$set: {content: msg.content.split(' ').slice(3).join(' ') }}); //msg.content.slice(msg.content.indexOf(args[1]) + args[1].length).trim() }});
  msg.channel.createMessage(`Tag \`${args[1].toLowerCase()}\` has been updated.`);
}

async function deleteTag(msg: Message<GuildTextableChannel>, args: string[]): Promise<void> {
  if(!args[1]) {
    msg.channel.createMessage('Include a tag silly goose');
    return;
  }
  if(!await msg._client.mango.collection<DatabaseTag>('tags').findOne({_id: args[1].toLowerCase()})) {
    msg.channel.createMessage(`Tag \`${args[1].toLowerCase()}\` does not exist!`);
    return;
  }

  await msg._client.mango.collection<DatabaseTag>('tags').deleteOne({_id: args[1].toLowerCase()});
  msg.channel.createMessage(`Tag \`${args[1].toLowerCase()}\` deleted.`);
}

async function sendTag(msg: Message<GuildTextableChannel>, args: string[]): Promise<void> {
  const tag = await msg._client.mango.collection<DatabaseTag>('tags').findOne({_id: args[0].toLowerCase() });
  if(!tag) {
    msg.channel.createMessage(`Tag \`${args[0].toLowerCase()}\` does not exist!`);
    return;
  }

  msg.channel.createMessage(tag.content);
}

export const description = 'Custom commands';

const BOAT_PREFIX = process.env['PREFIX'];

export async function executor(msg: Message<GuildTextableChannel>, args: string[]) {
  if(!msg.member) return;

  const dbCollection = msg._client.mango.collection<DBUser>('users');
  const dbAuthor = await dbCollection.findOne({_id: msg.author.id});
  const elevated = dbAuthor && ((dbAuthor.flags & UserFlags.STAFF) === UserFlags.STAFF);

  if(args.length === 0) {
    const parts = [
      'Usage:',
      ` - ${BOAT_PREFIX}tag [tag]`,
      ` - ${BOAT_PREFIX}tag list`
    ];

    if(elevated) {
      parts.push(
        ` - ${BOAT_PREFIX}tag add [tag] [contents]`,
        ` - ${BOAT_PREFIX}tag edit [tag] [contents]`,
        ` - ${BOAT_PREFIX}tag delete [tag]`
      );
    }

    msg.channel.createMessage(parts.join('\n'));
    return;
  }

  switch(args[0]) {
    case 'list':
      listTags(msg);
      break;
    case 'add':
      if(!elevated) return void msg.channel.createMessage('nope');
      addTag(msg, args);
      break;
    case 'edit':
      if(!elevated) return void msg.channel.createMessage('nope');
      editTag(msg, args);
      break;
    case 'delete':
      if(!elevated) return void msg.channel.createMessage('nope');
      deleteTag(msg, args);
      break;
    default:
      sendTag(msg, args);
      break;
  }
}