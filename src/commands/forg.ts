import type { GuildTextableChannel, Message } from 'eris';
import { IDS } from '../constants.js';


export const description = 'Forg';

export function executor(msg: Message<GuildTextableChannel>): void {
  if(msg.guildID !== IDS.server) return;


  if(msg.member.roles.includes(IDS.roles.forg)) {
    msg.member.removeRole(IDS.roles.forg);
    msg.channel.createMessage('unforg\'d');
  }
  else {
    msg.member.addRole(IDS.roles.forg);
    msg.channel.createMessage('get forg\'d lol');
  }
}