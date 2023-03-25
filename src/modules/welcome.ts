import { CommandClient, Member, Guild, GuildTextableChannel } from 'eris';
import { IDS, MESSAGES } from '../constants.js';

function processMember(guild: Guild, member: Member): void {
  if (guild.id !== IDS.server) return;
  if (!IDS.channels.welcome) return;
    
  const welcomeChannel = guild.channels.get(IDS.channels.welcome) as GuildTextableChannel;
  if (!welcomeChannel) return;

  welcomeChannel.createMessage(MESSAGES.welcome
    .replace(/%user/gi, `<@${member.id}>`)
    .replace(/%rules/gi, `<#${IDS.channels.rules}>`)
    .replace(/%faq/gi, `<#${IDS.channels.faq}>`)
  );
}

export default function (bot: CommandClient): void {
  bot.on('guildMemberAdd', processMember);
}
