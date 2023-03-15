import * as Discord from "discord.js";
import EventEmitter from "events";
import { ButtonMenuEndAction } from "../types/index.js";

type ComponentsType =
  | Array<Discord.ActionRow<Discord.MessageActionRowComponent>>
  | Array<Discord.ActionRowBuilder<Discord.MessageActionRowComponentBuilder>>;

interface MessageEditOptions extends Discord.MessageEditOptions {
  components?: ComponentsType;
}

export class ButtonMenu extends EventEmitter {
  private message: Discord.Message;
  private collector: Discord.InteractionCollector<Discord.CollectedMessageInteraction>;
  public page = 1;
  public pages = new Discord.Collection<number, MessageEditOptions>();
  public ended = false;
  public endAction: ButtonMenuEndAction = "DISABLE_BUTTONS";
  public resendButtonCustomLabel: string | undefined;

  /**
   * Create a new button menu
   * @class
   * @param message The message to add the menu to
   * @param user The ID of the person who triggered the menu (buttons restricted to this user)
   * @param options discord.js options to pass to use with the collector
   */
  public constructor(
    message: Discord.Message,
    user: Discord.Snowflake,
    options?: Discord.MessageCollectorOptionsParams<Discord.MessageComponentType>,
  ) {
    super();

    this.message = message;

    this.collector = message.createMessageComponentCollector({
      idle: 1000 * 60,
      ...options,
    });

    this.collector.on("collect", async (interaction) => {
      if (interaction.user.id !== user) {
        if (interaction.isMessageComponent()) {
          await interaction
            .reply({
              content: "This menu can only be used by the user who triggered it.",
              ephemeral: true,
            })
            .catch(() => null);
        }
        return;
      }
      this.emit("collect", interaction);
      if (interaction.isButton()) {
        if (interaction.customId === "next") {
          await this.goToPage(this.page + 1, interaction);
        } else if (interaction.customId === "previous") {
          await this.goToPage(this.page - 1, interaction);
        } else if (interaction.customId.startsWith("page-")) {
          const page = interaction.customId.slice(5);
          await this.goToPage(parseInt(page, 10), interaction);
        } else if (interaction.customId === "stop") {
          interaction.deferUpdate().catch(() => null);
          this.stop();
        }
      }
    });

    this.collector.on("end", async () => {
      this.ended = true;
      if (this.endAction !== "NONE" && (await this.fetchMessage())) {
        const newMessage: MessageEditOptions = {
          components: this.message.components,
        };

        if (this.endAction == "REMOVE_BUTTONS") {
          newMessage.components = [];
        } else if (newMessage.components && this.endAction == "DISABLE_BUTTONS") {
          newMessage.components = newMessage.components.map((row) => {
            const newRow = new Discord.ActionRowBuilder<Discord.MessageActionRowComponentBuilder>(
              row,
            );

            newRow.components.forEach((component, i) => {
              switch (component.data.type) {
                case Discord.ComponentType.Button:
                  if (component.data.style === Discord.ButtonStyle.Link) {
                    break;
                  }

                  const newButton = new Discord.ButtonBuilder(component.data);
                  newButton.setDisabled(true);
                  newRow.components[i] = newButton;
                  break;
                case Discord.ComponentType.StringSelect:
                  const newSelect = new Discord.SelectMenuBuilder(component.data);
                  newSelect.setDisabled(true);
                  newRow.components[i] = newSelect;
                  break;
              }
            });
            return newRow;
          });
        }
        await this.message.edit(newMessage).catch(() => null);
      }

      this.emit("end");
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
    this.emit("end");
    this.removeAllListeners();
  }

  /**
   * Resets the idle timer for the collector ending
   */
  public resetTimer(): void {
    this.collector.resetTimer();
  }

  /**
   * Check if the message still exists
   */
  private async fetchMessage(): Promise<boolean> {
    try {
      if (!this.message) return false;
      const newMessage = await this.message.fetch().catch(() => null);
      if (!newMessage) {
        this.stop();
        return false;
      }
      this.message = newMessage;

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Go to a page in the menu
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

    const newMessage: MessageEditOptions = {
      content: this.message.content,
      embeds: this.message.embeds,
      components: this.message.components,
      ...this.pages.get(page),
    };

    if (newMessage.components)
      newMessage.components = this.disableMenuButtons(newMessage.components, page);

    await this.message.edit(newMessage).catch(() => null);

    if (interaction) interaction.deferUpdate().catch(() => null);

    if (await this.fetchMessage()) {
      this.page = page;
      this.emit("pageChange", page);
    }
  }

  /**
   * Disable components that cannot be used on a certain page
   */
  private disableMenuButtons(
    components: ComponentsType = this.message.components,
    page: number = this.page,
  ): ComponentsType {
    const hasPrevious = this.pages.has(page - 1);
    const hasNext = this.pages.has(page + 1);

    const rows = components.map(
      (row) => new Discord.ActionRowBuilder<Discord.MessageActionRowComponentBuilder>(row),
    );

    rows.forEach((row) => {
      row.components.forEach((component, i) => {
        if (component.data.type !== Discord.ComponentType.Button) return;
        if (component.data.style === Discord.ButtonStyle.Link) return;
        if (!("customId" in component.data)) return;

        const builder = new Discord.ButtonBuilder(component.data);
        if (!("customId" in builder.data)) return;
        const { customId } = builder.data;
        if (typeof customId !== "string") return;

        if (customId === "previous") builder.setDisabled(!hasPrevious);
        if (customId === "next") builder.setDisabled(!hasNext);
        if (customId.startsWith("page-")) {
          const btnPage = customId.slice(5);
          builder.setDisabled(parseInt(btnPage, 10) == page);
        }

        row.components[i] = builder;
      });
    });

    return rows;
  }
}
