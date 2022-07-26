import { CommandClient, Member, Guild, GuildTextableChannel } from 'eris';
import { IDS, MESSAGES } from '../constants.js';

function processMember(guild: Guild, member: Member) {
  if(guild.id !== IDS.server) return;
    
  const welcomeChannel = guild.channels.get(IDS.channels.welcome) as GuildTextableChannel;

  welcomeChannel.createMessage(MESSAGES.welcome
    .replace(/%user/gi, `<@${member.id}>`)
    .replace(/%rules/gi, `<#${IDS.channels.rules}>`)
    .replace(/%faq/gi, `<#${IDS.channels.faq}>`)
  );
}

export default function (bot: CommandClient) {
  bot.on('guildMemberAdd', processMember);
}