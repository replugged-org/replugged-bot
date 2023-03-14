import { CustomClient } from '../types';
import * as Discord from 'discord.js';
import { isJSONEqual } from '../helpers';

function commandToData(command: Discord.ApplicationCommand | Discord.ApplicationCommandData): Discord.ApplicationCommandData {
  return {
    name: command.name || undefined,
    description: command.type == 'CHAT_INPUT' ? (command.description || undefined) : undefined,
    type: command.type || undefined,
    options: command.type == 'CHAT_INPUT' ? (command.options as Discord.ApplicationCommandOptionData[] || undefined) : undefined,
    defaultPermission: command.defaultPermission,
  } as Discord.ApplicationCommandData;
}

export async function setupCommands(client: CustomClient) {
  if (client.slashCommands) {
    const globalCmds = await client.application.commands.fetch();
    if (!globalCmds) return;
    client.slashCommands.forEach(async (command) => {
      const guild = command.guild ? client.guilds.cache.get(command.guild) : null;
      const guildCmds = (guild ? await guild.commands.fetch() : null);
      const existingCommand = command.guild ? (guild ? guildCmds.find((x) => x.name == command.data.name) : null) : globalCmds.find(
        (x) => x.name === command.data.name
      );
      if (existingCommand) {
        const didChange = !isJSONEqual(commandToData(existingCommand), commandToData(command.data));
        if (existingCommand.guildId !== command.guild) {
          existingCommand.delete().catch(() => null);
          client.application.commands
            .create(command.data, command.guild)
            .catch(() => null);
        } else if (didChange) {
          existingCommand.edit(command.data).catch(() => null);
        }
        globalCmds.delete(existingCommand.id);
      } else {
        client.application.commands
          .create(command.data, command.guild)
          .catch(() => null);
      }
    });
    globalCmds.forEach((command) => command.delete().catch(() => null));
  }
}

export async function cleanupGuildCommands(client: CustomClient, guild: Discord.Guild) {
  const guildCmds = (guild ? await guild.commands.fetch() : null);
  guildCmds.forEach((command) => {
    if (!client.slashCommands.find(x => x.guild == guild.id && x.data.name == command.name)) {
      command.delete().catch(() => null);
    }
  });
}