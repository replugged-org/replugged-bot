import * as Discord from 'discord.js';
import {
  CommandResponseOptions,
  CommandUseType,
  SlashCommandUsage,
} from '../types';
import {idsToSnowflakes} from '../helpers';
import {CommandUse} from '.';

export class SlashCommandUse<Args> extends CommandUse<Args> {
  public type: CommandUseType = 'SLASH';
  public interaction: Discord.CommandInteraction;

  constructor({interaction, command, dbUser, args}: SlashCommandUsage<Args>) {
    super({
      command,
      dbUser,
      author: interaction.user,
      member: null,
      client: interaction.client,
      guild: interaction.guild,
      channel: interaction.channel as
				| Discord.TextChannel
				| Discord.NewsChannel
				| Discord.ThreadChannel
				| Discord.DMChannel,
      args,
    });

    this.interaction = interaction;
  }

  /**
	 * Start typing in the channel
	 * @async
	 */
  public async startTyping(): Promise<void> {
    this.interaction.deferReply({ephemeral: true}).catch(() => null);
  }

  /**
	 * Stop typing in the channel
	 * @async
	 */
  public async stopTyping(): Promise<void> {
    if (this.interaction.deferred) {
      this.interaction.deleteReply().catch(() => null);
    }
  }

  /**
	 * Fetch the interaction's previous response
	 * @returns {Promise<Discord.Message | null>} The interactions previous response
	 */
  private async fetchOutput(): Promise<Discord.Message | null> {
    try {
      const output = await this.interaction.fetchReply().catch(() => null);
      if (output) this.output = output;
      return output;
    } catch (e) {
      return null;
    }
  }

  get prefix(): string {
    return '/';
  }

  public async sendMessage(
    payload: Discord.InteractionReplyOptions,
    options: CommandResponseOptions = {},
  ): Promise<Discord.Message> {
    const calculatedOptions = {
      reply: true,
      replyPing: false,
      escapeMentions: false,
      escapeEveryone: true,
      userMentions: null,
      roleMentions: [],
      saveOutput: false,
      editOutput: false,
      ephemeral: false,
      ...options,
    };

    const {
      reply,
      replyPing,
      escapeMentions,
      escapeEveryone,
      userMentions,
      roleMentions,
      ephemeral,
    } = calculatedOptions;

    if (payload.content) {
      if (escapeMentions) {
        payload.content = payload.content.replace(/@/g, '@\u200b');
      } else if (escapeEveryone) {
        payload.content = payload.content.replace(
          /@(everyone|here)/g,
          '@\u200b$1',
        );
      }
    }

    payload.ephemeral = ephemeral;

    if (!payload.allowedMentions) payload.allowedMentions = {};
    if (userMentions)
      payload.allowedMentions.users = idsToSnowflakes(
        userMentions,
      ).filter(x => x !== null);
    if (roleMentions)
      payload.allowedMentions.roles = idsToSnowflakes(
        roleMentions,
      ).filter(x => x !== null);
    if (replyPing && reply) {
      payload.allowedMentions.repliedUser = true;
    }

    this.stopTyping();

    let res: Discord.Message;
    if (
      (calculatedOptions.editOutput && this.interaction.replied) ||
			this.interaction.deferred
    ) {
      const original = await this.fetchOutput().catch(() => null);
      await this.interaction
        .editReply({
          content: original ? original.content || null : null,
          embeds: original.embeds,
          ...payload,
        })
        .catch(e => null);
      res = await this.fetchOutput();
    } else if (calculatedOptions.editOutput || !this.interaction.replied) {
      await this.interaction.reply(payload).catch(e => null);
      res = await this.fetchOutput();
    } else {
      res = await this.interaction.followUp(payload).catch(e => null);
      if (res) this.output = res;
    }
    return res;
  }

  public async sendEmbed(
    embed: Discord.Embed,
    options: CommandResponseOptions = {},
    rawOptions: Discord.InteractionReplyOptions = {},
  ): Promise<Discord.Message> {
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
  ): Promise<Discord.Message> {
    const payload = {
      content,
      ...rawOptions,
    };

    return await this.sendMessage(payload, options);
  }
}
