import { Constants, GuildTextableChannel, Message, ThreadChannel } from 'eris';

export const description = 'Archive a thread (staff only)';

export async function executor(msg: Message<GuildTextableChannel>, args: string[]) {
  if (!(msg.channel instanceof ThreadChannel)) return msg.channel.createMessage('This can only be used in a thread.');
  const channel = msg.channel as ThreadChannel; // Since Eris is not properly typed

  if (!channel.permissionsOf(msg.member).has(Constants.Permissions.manageThreads) && channel.ownerID !== msg.member.id) return channel.createMessage('nope');
  
  const locked = args.includes('--lock');

  await msg.delete();
  await channel.edit({archived: true, locked});
}