import { CustomClient } from "../types/index.js";
import * as Discord from "discord.js";
import { isEqual } from "lodash-es";

function commandToData(
  command: Discord.ApplicationCommand | Discord.ApplicationCommandData,
): Discord.ApplicationCommandData {
  return {
    name: command.name,
    description:
      command.type === Discord.ApplicationCommandType.ChatInput ? command.description : "",
    type: command.type || undefined,
    options:
      command.type == Discord.ApplicationCommandType.ChatInput
        ? (command.options as Discord.ApplicationCommandOptionData[]) || undefined
        : undefined,
    defaultMemberPermissions: command.defaultMemberPermissions,
  };
}

export async function setupCommands(client: CustomClient): Promise<void> {
  if (client.slashCommands) {
    let globalCmds = await client.application.commands.fetch();
    if (!globalCmds) return;
    client.slashCommands.forEach(async (command) => {
      let guild = command.guild ? client.guilds.cache.get(command.guild) : null;
      let guildCmds = guild ? await guild.commands.fetch() : null;
      let existingCommand = command.guild
        ? guild
          ? guildCmds!.find((x) => x.name == command.data.name)
          : null
        : globalCmds.find((x) => x.name === command.data.name);
      if (existingCommand) {
        let didChange = !isEqual(commandToData(existingCommand), commandToData(command.data));
        if (existingCommand.guildId !== command.guild) {
          existingCommand.delete().catch(() => null);
          client.application.commands.create(command.data, command.guild).catch(() => null);
        } else if (didChange) {
          existingCommand.edit(command.data).catch(() => null);
        }
        globalCmds.delete(existingCommand.id);
      } else {
        client.application.commands.create(command.data, command.guild).catch(() => null);
      }
    });
    globalCmds.forEach((command) => command.delete().catch(() => null));
  }
}

export async function cleanupGuildCommands(
  client: CustomClient,
  guild: Discord.Guild,
): Promise<void> {
  let guildCmds = guild ? await guild.commands.fetch() : null;
  guildCmds?.forEach((command) => {
    if (!client.slashCommands?.find((x) => x.guild == guild.id && x.data.name == command.name)) {
      command.delete().catch(() => null);
    }
  });
}

export async function cleanupGlobalCommands(
  client: CustomClient,
): Promise<void> {
  let globalCmds = await client.application.commands.fetch();
  globalCmds.forEach((command) => {
    command.delete().catch(() => null);
  })
}
