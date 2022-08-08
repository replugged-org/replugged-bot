import { GuildTextableChannel, Message } from 'eris';
import { inspect } from 'util';
import { UserFlags } from '../constants.js';
import { User as DBUser } from '../db.js';

export const description = 'Nope';

export async function executor(msg: Message<GuildTextableChannel>, args: string[]) {
  const client = msg._client;
  const channel = msg.channel;
  const dbCollection = client.mango.collection<DBUser>('users');
  const dbAuthor = await dbCollection.findOne({_id: msg.author.id});
  if (!dbAuthor || (dbAuthor.flags & UserFlags.ADMIN) === 0) return msg.channel.createMessage('nope');
  
  try {
    const res = await eval(args.join(' '));
    if (res) {
      const str = inspect(res, { depth: 2 });
	  channel.createMessage(`\`\`\`js\n${str}\n\`\`\``).catch(() => {
        channel.createMessage('Could not send result.');
	  });
    }
  }
  catch (e) {
    return channel.createMessage(`Error: ${e}`);
  }
}