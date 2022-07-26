import type { 
  CommandClient,
  GuildTextableChannel,
  Message
} from 'eris';
import type { DatabaseTag } from '../db';

const BOAT_PREFIX = process.env['PREFIX']!;

async function processMsg(this: CommandClient, msg: Message<GuildTextableChannel>): Promise<void> {
  if(!msg.content.startsWith(BOAT_PREFIX)) return;

  const command = msg.content.slice(BOAT_PREFIX.length).toLowerCase();
  const tag = await this.mango.collection<DatabaseTag>('tags').findOne({_id: command});

  if(tag) msg.channel.createMessage(tag.content);
}

export default function (bot: CommandClient): void {
  bot.on('messageCreate', processMsg);
}