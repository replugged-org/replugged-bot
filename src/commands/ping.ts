import type { GuildTextableChannel, Message } from 'eris';

export const description = 'Pong';

export function executor(msg: Message<GuildTextableChannel>): void {
  const start = Date.now();

  msg.channel.createMessage('🏓 Pong!').then((m) => {
    const rl = Date.now() - start;
    m.edit(`🏓 Pong! | REST: ${rl}ms - Gateway: ${msg._client.shards.get(0)?.latency}ms`);
  });
}