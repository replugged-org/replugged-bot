import * as Discord from "discord.js";
import { idToSnowflake } from "../helpers.js";
import { CommandUse } from "../stuct/index.js";
import { CustomClient } from "../types/index.js";

export default async (client: CustomClient, interaction: Discord.Interaction): Promise<void> => {
  if (interaction.isChatInputCommand()) {
    if (!interaction.user.id) return;

    if (!interaction.guildId) {
      await interaction
        .reply({
          content: "Interactions must be used in a server.",
          ephemeral: true,
        })
        .catch(() => null);
      return;
    }

    let name = interaction.commandName;
    let subCommandGroup = interaction.options.getSubcommandGroup(false);
    let subcommand = interaction.options.getSubcommand(false);
    if (subCommandGroup) name += `.${subCommandGroup}`;
    if (subcommand) name += `.${subcommand}`;

    let commandFile = client.commands?.get(name);
    if (!commandFile) {
      await interaction
        .reply({
          content: "Command not found.",
          ephemeral: true,
        })
        .catch(() => null);

      return;
    }

    let args = Object.fromEntries(
      interaction.options.data
        .map((x) => [x, ...(x.options ?? [])])
        .flat()
        .filter(
          (x) =>
            x &&
            ![
              Discord.ApplicationCommandOptionType.Subcommand,
              Discord.ApplicationCommandOptionType.SubcommandGroup,
            ].includes(x.type),
        )
        .map((x) => [x.name, x.user || x.role || x.channel || x.value]),
    );

    const commandUse = new CommandUse({
      interaction,
      command: commandFile,
      args,
    });

    const usable = await commandUse.canUse();
    if (!usable.canUse) {
      if (usable.responseMessage)
        await commandUse.sendMessage({
          ...usable.responseMessage,
          ephemeral: true,
        });
      return;
    }

    try {
      // @ts-expect-error Doesn't like that the default parameter is never
      await commandFile.run(commandUse);
    } catch (e) {
      console.error(`An error occurred while running ${name}`, e);
      await commandUse.sendMessage(
        {
          content: `An error occurred, please try again later.`,
          embeds: [],
          components: [],
        },
        {
          editOutput: true,
        },
      );
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId.startsWith("resend-")) {
      const { channel, user } = interaction;
      if (!channel) return;
      const triggerMessageId = interaction.customId.slice(7);
      const triggerMessage = await channel.messages
        .fetch(idToSnowflake(triggerMessageId)!)
        .catch(() => null);
      if (!triggerMessage) {
        interaction
          .reply({
            content: "Could not resend menu.",
            ephemeral: true,
          })
          .catch(() => null);

        return;
      }
      if (user.id !== triggerMessage.author.id) {
        interaction
          .reply({
            content: "You cannot use this.",
            ephemeral: true,
          })
          .catch(() => null);

        return;
      }
      client.emit("messageCreate", triggerMessage);
      interaction.deferUpdate().catch(() => null);
    }
  }
};
