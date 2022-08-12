import type { GuildTextableChannel, Message } from 'eris';
import { IDS } from '../constants.js';


export const description = 'Forg';

export function executor(msg: Message<GuildTextableChannel>): void {
  if(msg.guildID !== IDS.server) return;


  if(msg.member.roles.includes(IDS.roles.forg)) {
    msg.channel.createMessage('forg is eternal <:forg:1004880213081075772>');
  }
  else {
    msg.member.addRole(IDS.roles.forg);
    msg.channel.createMessage('<:forg1:1004880422980817056><:forg2:1004880423790334042><:forg3:1004880424624980111><:forg4:1004880426541793310><:forg5:1004880427552624650>');
  }
}