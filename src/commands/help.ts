import type { GuildTextableChannel, Message } from 'eris';

export const description = 'Shows this message';

export function executor(msg: Message<GuildTextableChannel>): void {
  let help = '```asciidoc\n';
  Object.values(msg._client.commands).forEach((cmd) => {
    if(cmd.description !== 'No description') {
      help += `${process.env['PREFIX']}${cmd.label.padEnd(10)} :: ${cmd.description}\n`;
    }
  });
  help += '```';

  msg.channel.createMessage(help);
}