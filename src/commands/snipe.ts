import type { EmbedField, EmbedOptions, GuildTextableChannel, Message } from 'eris';
import { getLastMessages, SNIPE_LIFETIME } from '../modules/sniper.js';

const ANIMALS = [
  '🦅', '🐦', '🦄', '🐙', '🐢', '🐌', '🐬', '🐠', '🦈', '🦏'
];

export const description = `Sends a copy of messages deleted or edited in the last ${SNIPE_LIFETIME} seconds.`;

export function executor(msg: Message<GuildTextableChannel>): void {
  const last = getLastMessages();

  if(last.length === 0) {
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    msg.channel.createMessage(`${animal} There is nothing to snipe.`);
    return;
  }

  const fields: EmbedField[][] = [ [] ];

  let cursor = 0;
  let length = 0;

  for(const snipe of last) {
    const name = `${snipe.author} (${snipe.type})`;

    if(fields[cursor].length === 25 || length + name.length + (Math.floor(snipe.msg.length / 1024) * 3) + snipe.msg.length >= 5900) {
      fields.push([]),
      length = 0;
      cursor++;
    }

    length += name.length + snipe.msg.length;
    fields[cursor].push({
      name: `${snipe.author} (${snipe.type}) in #${snipe.channel}`,
      value: snipe.msg.slice(0, 1024)
    });

    if(snipe.msg.length > 1024) {
      fields[cursor].push({
        name: '...',
        value: snipe.msg.slice(1024),
      });
    }
  }

  fields.forEach((f, i) => {
    const embed: EmbedOptions = {fields: f};
    if(i === 0) embed.description = `Edits and deletes for the last ${SNIPE_LIFETIME} seconds`;
    if(i === fields.length - 1) embed.footer = {text: `Sniped by ${msg.author.username}#${msg.author.discriminator}`};

    msg.channel.createMessage({embed: embed});
  });
}