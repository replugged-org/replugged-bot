import * as Discord from 'discord.js';
import * as EventEmitter from 'events';
import { ButtonMenuEndAction } from '../types';

export class ButtonMenu extends EventEmitter {
  private message: Discord.Message;
  private triggerMessage: Discord.Message;
  private collector: Discord.InteractionCollector<Discord.Interaction>;
  public page: number = 1;
  public pages: Discord.Collection<number, Discord.MessageOptions> =
    new Discord.Collection<number, Discord.MessageOptions>();
  public ended: boolean = false;
  public endAction: ButtonMenuEndAction = 'DISABLE_BUTTONS';
  public resendButtonCustomLabel: string;

  /**
	 * Create a new button menu
	 * @class
	 * @param {Discord.Message} message The message to add the menu to
	 * @param {Discord.Snowflake} user The ID of the person who triggered the menu (buttons restricted to this user)
	 * @param {Discord.Message | null} [triggerMessage] The message that triggered the menu
	 * @param {Discord.MessageComponentCollectorOptions} [options] discord.js options to pass to use with the collector
	 */
  constructor(
    message: Discord.Message,
    user: Discord.Snowflake,
    triggerMessage?: Discord.Message | null,
    options?: Discord.MessageComponentCollectorOptions<Discord.MessageComponentInteraction>,
  ) {
    super();

    this.message = message;
    if (triggerMessage) this.triggerMessage = triggerMessage;

    this.collector = message.createMessageComponentCollector({
      idle: 1000 * 60,
      ...options,
    });

    this.collector.on('collect', async interaction => {
      if (interaction.user.id !== user) {
        if (interaction.isMessageComponent()) {
          await interaction
            .reply({
              content:
								'This menu can only be used by the user who triggered it.',
              ephemeral: true,
            })
            .catch(() => null);
        }
        return;
      }
      this.emit('collect', interaction);
      if (interaction.isButton()) {
        if (interaction.customId === 'next') {
          this.goToPage(this.page + 1, interaction);
        } else if (interaction.customId === 'previous') {
          this.goToPage(this.page - 1, interaction);
        } else if (interaction.customId.startsWith('page-')) {
          const page = interaction.customId.slice(5);
          this.goToPage(parseInt(page), interaction);
        } else if (interaction.customId === 'stop') {
          interaction.deferUpdate().catch(() => null);
          this.stop();
        }
      }
    });

    this.collector.on('end', async () => {
      this.ended = true;
      if (this.endAction !== 'NONE' && (await this.fetchMessage())) {
        const newMessage: Discord.MessageOptions = {
          components: this.message.components,
        };

        if (this.endAction === 'RESEND_BUTTON' && !triggerMessage)
          this.endAction = 'DISABLE_BUTTONS';

        if (this.endAction === 'RESEND_BUTTON') {
          triggerMessage = await triggerMessage
            .fetch()
            .catch(() => null);
          if (triggerMessage && !triggerMessage.deleted)
            newMessage.components = [
              new Discord.MessageActionRow().addComponents([
                new Discord.MessageButton({
                  style: 'PRIMARY',
                  customId: `resend-${triggerMessage.id}`,
                  label:
										this.resendButtonCustomLabel ||
										'Resend Menu',
                }),
              ]),
            ];
        } else if (this.endAction == 'REMOVE_BUTTONS') {
          newMessage.components = [];
        } else if (
          newMessage.components &&
					this.endAction == 'DISABLE_BUTTONS'
        ) {
          newMessage.components = newMessage.components.map(
            (
              row: Discord.MessageActionRow,
            ): Discord.MessageActionRow => {
              row.components = row.components.map(
                (
                  component,
                ): Discord.MessageActionRowComponent => {
                  if (
                    component.type !== 'BUTTON' ||
										component.style !== 'LINK'
                  )
                    component.disabled = true;
                  return component;
                },
              );
              return row;
            },
          );
        }
        await this.message.edit(newMessage).catch(() => null);
      }

      this.emit('end');
      this.removeAllListeners();
    });
  }

  /**
	 * Stop the menu
	 * @param endAction The action to take when the menu ends. Option on menu will be used if not provided.
	 */
  public stop(endAction?: ButtonMenuEndAction | null): void {
    if (endAction) this.endAction = endAction;
    this.collector.stop();
    this.emit('end');
    this.removeAllListeners();
    return;
  }

  /**
	 * Resets the idle timer for the collector ending
	 */
  public resetTimer(): void {
    this.collector.resetTimer();
    return;
  }

  /**
	 * Check if the message still exists
	 * @async
	 * @returns {Promsie<boolean>} Whether or not the message still exists
	 */
  private async fetchMessage(): Promise<boolean> {
    try {
      if (!this.message || this.message.deleted) return false;
      this.message = await this.message.fetch().catch(() => null);
      if (!this.message || this.message.deleted) {
        this.stop();
        return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
	 * Go to a page in the menu
	 * @async
	 * @param {number} page The page to go to
	 * @param {Discord.MessageComponentInteraction} interaction An interaction to respond to
	 */
  public async goToPage(
    page: number,
    interaction?: Discord.MessageComponentInteraction,
  ): Promise<void> {
    if (!this.pages.has(page)) {
      if (interaction) interaction.deferUpdate().catch(() => null);
      return;
    }
    if (!(await this.fetchMessage())) {
      if (interaction) interaction.deferUpdate().catch(() => null);
      return;
    }

    const newMessage: Discord.MessageOptions = {
      content: this.message.content || null,
      embeds: this.message.embeds,
      components: this.message.components,
      ...this.pages.get(page),
    };

    const hasPrevious = this.pages.has(page - 1);
    const hasNext = this.pages.has(page + 1);

    if (newMessage.components)
      newMessage.components = this.disableMenuButtons(
        newMessage.components as Discord.MessageActionRow[],
        page,
      );

    await this.message.edit(newMessage).catch(() => null);

    if (interaction) interaction.deferUpdate().catch(() => null);

    if (await this.fetchMessage()) {
      this.page = page;
      this.emit('pageChange', page);
    }
    return;
  }

  /**
	 * Make all buttons and select menus disabled, except for link buttons
	 */
  private disableMenuButtons(
    components: Discord.MessageActionRow[] = this.message.components,
    page: number = this.page,
  ) {
    const hasPrevious = this.pages.has(page - 1);
    const hasNext = this.pages.has(page + 1);

    return components.map(
      (row: Discord.MessageActionRow): Discord.MessageActionRow => {
        row.components = row.components.map(
          (component): Discord.MessageActionRowComponent => {
            if (component.type === 'BUTTON' && component.customId) {
              if (component.customId === 'previous')
                component.disabled = !hasPrevious;
              if (component.customId === 'next')
                component.disabled = !hasNext;
              if (component.customId.startsWith('page-')) {
                const btnPage = component.customId.slice(5);
                component.disabled = parseInt(btnPage) == page;
              }
            }
            return component;
          },
        );
        return row;
      },
    );
  }
}
