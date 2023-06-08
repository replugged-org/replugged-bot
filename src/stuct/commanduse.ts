import * as Discord from "discord.js";
import {
  CanUse,
  CommandHelp,
  CommandResponseOptions,
  CommandUsage,
  CustomClient,
} from "../types/index.js";
import { Command } from "./command.js";
import { BaseMessageOptions, ButtonMenu } from "./index.js";
import { compact } from "lodash-es";
import { PermissionFlagsBits } from "discord.js";
import { UserFlags } from "../constants.js";

export class CommandUse<Args> {
  public args: Args;

  public author: Discord.User | Discord.PartialUser;
  public member: Discord.GuildMember | Discord.APIInteractionGuildMember;
  public client: CustomClient;
  public guild: Discord.Guild;
  public channel: Discord.TextBasedChannel;

  public command: Command;

  public interaction: Discord.CommandInteraction;
  public content?: string | null;
  public output?: Discord.Message | null;

  /**
   * Create a use of a command
   * @param {CommandUsage} usage The details of the use
   */
  public constructor({ command, args, interaction }: CommandUsage<Args>) {
    this.command = command;
    this.author = interaction.user;
    this.member = interaction.member!;
    this.client = interaction.client;
    this.guild = interaction.guild!;
    this.channel = interaction.channel!;
    this.args = args;

    this.interaction = interaction;
  }

  /**
   * Get a full user object from a potentially partial user object
   */
  public async getFullAuthor(): Promise<Discord.User | null> {
    let fetchedUser: Discord.User | null;
    if (this.author.partial) {
      fetchedUser = await this.client.users.fetch(this.author.id).catch(() => null);
    } else {
      fetchedUser = this.author;
    }
    return fetchedUser || null;
  }

  /**
   * Check if the user can use the command
   */
  public async canUse(): Promise<CanUse> {
    const member = await this.guild.members.fetch(this.author.id).catch(() => null);

    if (!member)
      return {
        canUse: false,
        responseMessage: {
          content: "An error occurred, please try again.",
        },
      };

    const db_user = await this.client.prisma?.users?.findFirst({
      where: { discord_id: member.id },
    });
    if (db_user) {
      if (
        this.command.config.flags.includes("admin") &&
        (db_user.flags & UserFlags.ADMIN) !== UserFlags.ADMIN
      ) {
        return {
          canUse: false,
          responseMessage: {
            content: "You must be an admin to run this command.",
          },
        };
      }
      if (
        this.command.config.flags.includes("staff") &&
        (db_user.flags & UserFlags.STAFF) !== UserFlags.STAFF
      ) {
        return {
          canUse: false,
          responseMessage: {
            content: "You must be staff to run this command.",
          },
        };
      }
      if (
        this.command.config.flags.includes("dev") &&
        (db_user.flags & UserFlags.DEVELOPER) !== UserFlags.DEVELOPER
      ) {
        return {
          canUse: false,
          responseMessage: {
            content: "You must be a developer to run this command.",
          },
        };
      }
      if (
        this.command.config.flags.includes("support") &&
        (db_user.flags & UserFlags.SUPPORT) !== UserFlags.SUPPORT
      ) {
        return {
          canUse: false,
          responseMessage: {
            content: "You must be a support staff to run this command.",
          },
        };
      }
    }

    const cooldown = this.command.getCooldown(this.author.id);
    if (cooldown !== 0) {
      return {
        canUse: false,
        responseMessage: {
          embeds: [
            new Discord.EmbedBuilder()
              .setTitle("You are on cooldown")
              .setColor(0xff0000)
              .setDescription(`Try again in ${cooldown} seconds.`),
          ],
        },
      };
    }

    this.setCooldown(2000);

    return {
      canUse: true,
      responseMessage: null,
    };
  }

  /**
   * Fetch the interaction's previous response
   */
  private async fetchOutput(): Promise<Discord.Message | null> {
    try {
      const output = await this.interaction.fetchReply().catch(() => null);
      if (output) this.output = output;
      return output;
    } catch {
      return null;
    }
  }

  public async sendMessage(
    payload: string | Discord.InteractionReplyOptions,
    options: CommandResponseOptions = {},
  ): Promise<Discord.Message | null> {
    if (typeof payload === "string") payload = { content: payload };

    const calculatedOptions: CommandResponseOptions = {
      reply: true,
      replyPing: false,
      userMentions: true,
      roleMentions: null,
      everyoneMention: false,
      saveOutput: false,
      editOutput: false,
      ephemeral: false,
      ...options,
    };

    const { reply, replyPing, userMentions, roleMentions, everyoneMention, ephemeral } =
      calculatedOptions;

    payload.ephemeral = ephemeral;

    payload.allowedMentions ??= {};
    payload.allowedMentions.parse ??= [];

    if (userMentions) {
      payload.allowedMentions.parse.push("users");
      if (Array.isArray(userMentions)) payload.allowedMentions.users = compact(userMentions);
    }
    if (roleMentions) {
      payload.allowedMentions.parse.push("roles");
      if (Array.isArray(roleMentions)) payload.allowedMentions.roles = compact(roleMentions);
    }
    if (everyoneMention) {
      payload.allowedMentions.parse.push("everyone");
    }

    if (replyPing && reply) {
      payload.allowedMentions.repliedUser = true;
    }

    let res: Discord.Message | null = null;
    if ((calculatedOptions.editOutput && this.interaction.replied) || this.interaction.deferred) {
      const original = await this.fetchOutput().catch(() => null);
      await this.interaction
        .editReply({
          content: original?.content,
          embeds: original?.embeds,
          ...payload,
        })
        .catch(() => null);
      res = await this.fetchOutput();
    } else if (calculatedOptions.editOutput || !this.interaction.replied) {
      await this.interaction.reply(payload).catch(() => null);
      res = await this.fetchOutput();
    } else {
      res = await this.interaction.followUp(payload).catch(() => null);
      if (res) this.output = res;
    }
    return res;
  }

  public async sendEmbed(
    embed: Discord.Embed | Discord.EmbedBuilder,
    options: CommandResponseOptions = {},
    rawOptions: Discord.InteractionReplyOptions = {},
  ): Promise<Discord.Message | null> {
    const payload = {
      embeds: [embed],
      ...rawOptions,
    };

    return await this.sendMessage(payload, options);
  }

  public async sendText(
    content: string,
    options: CommandResponseOptions = {},
    rawOptions: Discord.InteractionReplyOptions = {},
  ): Promise<Discord.Message | null> {
    const payload = {
      content,
      ...rawOptions,
    };

    return await this.sendMessage(payload, options);
  }

  /**
   * Send a help menu for this command
   * @async
   */
  public async sendHelp(): Promise<void> {
    await this.sendMessage(this.generateCommandEmbed(), {
      saveOutput: true,
    });
    if (!this.output) return;

    const menu = new ButtonMenu(this.output, this.author.id, {
      idle: 1000 * 60 * 5,
    });

    menu.on("collect", async (interaction: Discord.Interaction) => {
      if (interaction.isButton()) {
        if (interaction.customId.startsWith("command-")) {
          const cmd = interaction.customId.slice(8);
          await this.editHelp(cmd, interaction);
        }
      }
      if (interaction.isStringSelectMenu()) {
        if (interaction.customId == "command") {
          const cmd = interaction.values[0];
          await this.editHelp(cmd.replace(/ /g, "."), interaction);
        }
      }
    });
  }

  /**
   * Edit the help menu on interaction use
   * @async
   * @param {string} cmd The command to show in the help menu
   * @param {Discord.SelectMenuInteraction | Discord.ButtonInteraction} interaction The interaction to respond to
   */
  private async editHelp(
    cmd: string,
    interaction: Discord.SelectMenuInteraction | Discord.ButtonInteraction,
  ): Promise<void> {
    const cmdFile = this.client.commands?.get(cmd);
    if (!cmdFile) {
      await interaction.reply({ content: "Command not found.", ephemeral: true }).catch(() => null);
      return;
    }
    const output = this.generateCommandEmbed(cmdFile.help);
    if (!output) {
      await interaction.reply({ content: "Command not found.", ephemeral: true }).catch(() => null);
      return;
    }

    await this.sendMessage(output, {
      editOutput: true,
      saveOutput: true,
    });
    interaction.deferUpdate().catch(() => null);
  }

  /**
   * Generate an embed for command help
   * @param {CommandHelp} help The command help object
   * @param {boolean} [inMenu=false] Whether the help is being sent in a menu
   */
  public generateCommandEmbed(
    cmdHelp: CommandHelp = this.command.help,
    inMenu = false,
  ): BaseMessageOptions {
    const commandName = cmdHelp.name.replace(/\./g, " ");

    const title = [
      `/${commandName}`,
      `${cmdHelp.args
        .map((arg) => ("required" in arg && arg.required ? `<${arg.name}>` : `[${arg.name}]`))
        .join(" ")}`,
    ].join(" ");
    const { description } = cmdHelp;
    const fields: Discord.EmbedField[] = [];
    const components: Array<Discord.ActionRowBuilder<Discord.MessageActionRowComponentBuilder>> =
      [];
    if (cmdHelp.subcommands)
      components.push(
        new Discord.ActionRowBuilder<Discord.MessageActionRowComponentBuilder>().addComponents([
          new Discord.StringSelectMenuBuilder({
            customId: "command",
            placeholder: "Select a subcommand",
            options: cmdHelp.subcommands.map((cmd: string) => ({
              label: `/${commandName} ${cmd}`,
              value: `${commandName}.${cmd}`,
            })),
          }),
        ]),
      );
    if (cmdHelp.name.includes(".")) {
      const mainCmd = cmdHelp.name.split(".").slice(0, -1).join(".");
      components.push(
        new Discord.ActionRowBuilder<Discord.MessageActionRowComponentBuilder>().addComponents([
          new Discord.ButtonBuilder({
            style: Discord.ButtonStyle.Primary,
            emoji: "⏪",
            label: "Back",
            customId: `command-${mainCmd}`,
          }),
        ]),
      );
    } else if (inMenu) {
      components.push(
        new Discord.ActionRowBuilder<Discord.MessageActionRowComponentBuilder>().addComponents([
          new Discord.ButtonBuilder({
            style: Discord.ButtonStyle.Primary,
            emoji: "⏪",
            label: "Back",
            customId: "back",
          }),
        ]),
      );
    }

    return {
      embeds: [
        new Discord.EmbedBuilder()
          .setColor(0xff0000)
          .setTitle(title)
          .setDescription(description)
          .addFields(fields),
      ],
      components,
    };
  }

  /**
   * Set a cooldown on the user
   * @param {number} [cooldown=Cooldown in command config] The cooldown in milliseconds
   */
  public setCooldown(cooldown: number = this.command.config.cooldown): void {
    this.command.setCooldown(this.author.id, cooldown);
  }
}
