import * as Discord from "discord.js";
import { CommandConfig, CommandHelp, CommandOptions } from "../types/index.js";
import { CommandUse } from "./commanduse.js";

export abstract class Command {
  public help: CommandHelp;
  public config: CommandConfig;
  private cooldown: Discord.Collection<string, Date> = new Discord.Collection();

  /**
   * Create a new command
   * @param {CommandOptions} commandOptions Options for the command
   */
  public constructor({
    name,
    description,
    mainCommandDescription,
    category,
    args = [],
    examples = [],
    flags = [],
    cooldown = 0,
    limit = -1,
    hidden = false,
    slashCommand = true,
    textCommand = true,
    userContextMenu = false,
    messageContextMenu = false,
    subCommandName,
  }: CommandOptions) {
    this.help = {
      name,
      description,
      mainCommandDescription,
      category,
      args,
      examples,
      hidden,
      slashCommand,
      textCommand,
      userContextMenu,
      messageContextMenu,
    };
    this.config = {
      name,
      flags,
      cooldown,
      limit,
      slashCommand,
      textCommand,
      subCommandName,
      userContextMenu,
      messageContextMenu,
    };
  }

  /**
   * Get the cooldown for a user
   * @user The user to get the cooldown for
   * @returns The cooldown in milliseconds
   */
  public getCooldown(user: Discord.Snowflake): number {
    if (this.config.cooldown == 0) return 0;
    const cd = this.cooldown.get(user);
    if (!cd) return 0;
    if (cd.getTime() > Date.now()) {
      return Math.ceil((cd.getTime() - Date.now()) / 1000);
    } else {
      this.cooldown.delete(user);
      return 0;
    }
  }

  /**
   * Set the cooldown for a user
   * @param user The user to get the cooldown for
   * @param cooldown The cooldown in milliseconds
   */
  public setCooldown(user: Discord.Snowflake, cooldown: number = this.config.cooldown): void {
    if (cooldown == 0) return;
    this.cooldown.set(user, new Date(Date.now() + cooldown));
    setTimeout(() => {
      if (this.cooldown.get(user)?.getTime() ?? new Date().getTime() > 0)
        this.cooldown.delete(user);
    }, cooldown);
  }

  public abstract run(command: CommandUse<never>): Promise<void>;
}
