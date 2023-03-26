import * as Discord from "discord.js";
import { ApplicationCommandOptionType } from "discord.js";
import { BaseMessageOptions, ButtonMenu, Command, CommandUse } from "../../stuct/index.js";
import { CommandHelp } from "../../types/index.js";

interface Args {
  command?: string;
}

export default class Help extends Command {
  public constructor() {
    super({
      name: "help",
      description: "The page you're looking at",
      category: "Information",
      args: [
        {
          name: "command",
          type: ApplicationCommandOptionType.String,
          description: "Show information on this command",
          required: false,
        },
      ],
    });
  }

  public async run(command: CommandUse<Args>): Promise<void> {
    const { client, args, author } = command;

    const commandArg = args.command?.toLowerCase()?.split(" ");

    if (!client.help) {
      await command.sendMessage(
        "There was an error loading the help command. Please try again later.",
        {
          ephemeral: true,
        },
      );
      return;
    }

    const help = client.help
      .filter((cmd) => cmd && !cmd.hidden && cmd.name !== "" && cmd.slashCommand)
      .map((cmd, key) => {
        cmd = Object.assign({}, cmd);
        cmd.name = key;
        cmd.description = cmd.description || "No help found";
        return cmd;
      });

    let home: BaseMessageOptions | undefined;
    let categoryPages: Record<string, BaseMessageOptions[] | undefined>;
    if (commandArg) {
      await command.sendMessage(generateCommandEmbed(commandArg)!, {
        saveOutput: true,
      });
    } else {
      const categories = help
        .filter((x) => x.category && x.category !== "" && !x.name.includes("."))
        .reduce<Record<string, CommandHelp[]>>((cats, cmd) => {
          if (!cmd.category) return cats;
          cats[cmd.category] ??= [];
          cats[cmd.category].push(cmd);
          return cats;
        }, {});

      const categoryList = ["Information", "Replugged"];

      categoryPages = Object.fromEntries(
        Object.entries(categories).map((category): [string, BaseMessageOptions[]] => {
          const grouped: CommandHelp[][] = [];

          while (category[1].length > 0) grouped.push(category[1].splice(0, 5));

          return [
            category[0],
            grouped.map(
              (page, index): BaseMessageOptions => ({
                embeds: [
                  new Discord.EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle(`${category[0]} Command List`)
                    .setDescription(`\`<>\` arguments are required, \`[]\` arguments are optional.`)
                    .addFields(
                      page.map((cmd: CommandHelp) => ({
                        name: `/${cmd.name}`,
                        value: cmd.mainCommandDescription || cmd.description,
                      })),
                    )
                    .setFooter({
                      text: `Page ${index + 1}/${
                        grouped.length
                      } | Use the dropdown below to view more info on a command`,
                    }),
                ],
                components: [
                  new Discord.ActionRowBuilder<Discord.MessageActionRowComponentBuilder>().addComponents(
                    [
                      new Discord.StringSelectMenuBuilder({
                        customId: "command",
                        placeholder: "Get command info",
                        options: page.map((cmd: CommandHelp) => ({
                          label: `/${cmd.name}`,
                          value: cmd.name,
                        })),
                      }),
                    ],
                  ),
                  new Discord.ActionRowBuilder<Discord.MessageActionRowComponentBuilder>().addComponents(
                    [
                      new Discord.ButtonBuilder({
                        customId: "home",
                        label: "Category List",
                        emoji: "⏪",
                        style: Discord.ButtonStyle.Primary,
                      }),
                      new Discord.ButtonBuilder({
                        customId: "previous",
                        disabled: !grouped[index - 1],
                        label: "Previous",
                        emoji: "◀️",
                        style: grouped[index - 1]
                          ? Discord.ButtonStyle.Primary
                          : Discord.ButtonStyle.Secondary,
                      }),
                      new Discord.ButtonBuilder({
                        customId: "next",
                        disabled: !grouped[index + 1],
                        label: "Next",
                        emoji: "▶️",
                        style: grouped[index + 1]
                          ? Discord.ButtonStyle.Primary
                          : Discord.ButtonStyle.Secondary,
                      }),
                    ],
                  ),
                ],
              }),
            ),
          ];
        }),
      );
      home = {
        embeds: [
          new Discord.EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Help")
            .setDescription(
              [
                "Click a button to view a list of commands for that category.",
                `To view help for a specific command, do \`/help <command>\`.`,
              ].join("\n\n"),
            ),
        ],
        components: [
          new Discord.ActionRowBuilder<Discord.MessageActionRowComponentBuilder>().addComponents(
            categoryList.map(
              (cat) =>
                new Discord.ButtonBuilder({
                  style: Discord.ButtonStyle.Primary,
                  label: cat,
                  customId: `category-${cat}`,
                }),
            ),
          ),
        ],
      };

      await command.sendMessage(home, {
        saveOutput: true,
      });
    }

    if (!command.output?.components?.[0]) return;

    const menu = new ButtonMenu(command.output, author.id, {
      idle: 1000 * 60 * 5,
    });
    if (home) menu.pages.set(1, home);

    menu.on("collect", async (interaction: Discord.Interaction) => {
      if (interaction.isButton()) {
        if (categoryPages && interaction.customId.startsWith("category-")) {
          const category = interaction.customId.slice(9);
          const pages = categoryPages[category];
          if (!pages)
            return await interaction
              .reply({
                content: "Category not found.",
                ephemeral: true,
              })
              .catch(() => null);

          menu.pages.clear();
          pages.forEach((page, index) => {
            menu.pages.set(index + 1, page);
          });

          await menu.goToPage(1, interaction);
        }
        if (interaction.customId.startsWith("command-")) {
          const cmd = interaction.customId.slice(8);
          const output = generateCommandEmbed(cmd.split("."), Boolean(commandArg), true);
          if (!output)
            return await interaction
              .reply({
                content: "Command not found.",
                ephemeral: true,
              })
              .catch(() => null);
          await command.sendMessage(output, {
            editOutput: true,
            saveOutput: true,
          });
          await interaction.deferUpdate().catch(() => null);
        }

        if (home && interaction.customId == "home") {
          menu.pages.clear();
          menu.pages.set(1, home);
          await menu.goToPage(1, interaction);
        }

        if (interaction.customId == "back") {
          await menu.goToPage(menu.page, interaction);
        }
      }
      if (interaction.isStringSelectMenu()) {
        if (interaction.customId == "command") {
          const cmd = interaction.values[0];
          const output = generateCommandEmbed(cmd.split(" "), !commandArg);
          if (!output)
            return await interaction
              .reply({
                content: "Command not found.",
                ephemeral: true,
              })
              .catch(() => null);

          await command.sendMessage(output, {
            editOutput: true,
            saveOutput: true,
          });
          return interaction.deferUpdate().catch(() => null);
        }
      }
    });

    function generateCommandEmbed<T extends boolean>(
      args: string[],
      inMenu = false,
      nullWhenNotFound: T = inMenu as T,
    ): BaseMessageOptions | null {
      let commandName = args[0].toLowerCase();

      if (commandName)
        for (let arg of args.slice(1)) {
          const newName = `${commandName}.${arg.toLowerCase()}`;
          if (client.commands?.get(newName)) {
            commandName = newName;
          } else {
            break;
          }
        }

      if (!commandName)
        return nullWhenNotFound
          ? null
          : {
              content: "Command not found.",
            };

      const cmdHelp = help.find((x) => x.name == commandName);
      if (!cmdHelp)
        return nullWhenNotFound
          ? null
          : {
              content: "Command not found.",
            };

      return command.generateCommandEmbed(cmdHelp, inMenu);
    }
  }
}
