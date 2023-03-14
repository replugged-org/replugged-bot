import * as Discord from 'discord.js';
import { CommandConfig, CommandHelp, CommandOptions } from '../types';
import { CommandUse } from './commanduse';

export abstract class Command {
  public help: CommandHelp;
  public config: CommandConfig;
  private cooldown: Discord.Collection<string, Date> =
    new Discord.Collection();

  /**
	 * Create a new command
	 * @param {CommandOptions} commandOptions Options for the command
	 */
  constructor({
    name,
    description = null,
    mainCommandDescription = null,
    category = null,
    args = [],
    examples = [],
    aliases = [],
    flags = [],
    cooldown = 0,
    limit = -1,
    protip = '',
    hidden = false,
    hideAliases = false,
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
      aliases,
      protip,
      hideAliases,
      hidden,
      slashCommand,
      textCommand,
      userContextMenu,
      messageContextMenu,
    };
    this.config = {
      name,
      aliases,
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
	 * @param {Discord.Snowflake} user The user to get the cooldown for
	 * @returns {number} The cooldown in milliseconds
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
	 * @param {Discord.Snowflake} user The user to get the cooldown for
	 * @param {number} [cooldown=Cooldown in command config] The cooldown in milliseconds
	 */
  public setCooldown(
    user: Discord.Snowflake,
    cooldown: number = this.config.cooldown,
  ): void {
    if (cooldown == 0) return;
    this.cooldown.set(user, new Date(Date.now() + cooldown));
    setTimeout(() => {
      if (this.cooldown.get(user).getTime() < new Date().getTime())
        this.cooldown.delete(user);
    }, cooldown);
  }

  /**
	 * Run the command
	 * @param {CommandUse} command Information about the use
	 */
  abstract run(command: CommandUse<any>): Promise<any>;

  /**
	 * Transform message command args into an object
	 * @async
	 * @param {string[]} args The arguments to transform
	 * @param {Discord.Message} message The message the args are from
	 */
  public async transformCommandArgs(
    args: string[],
    message: Discord.Message,
  ): Promise<{[key: string]: any}> {
    return Object.fromEntries(args.entries());
  }

  /**
	 * Transform slash command args into an object
	 * @async
	 * @param {[key: string]: any} args The arguments to transform
	 * @param {Discord.CommandInteraction} interaction The interaction the args are from
	 */
  public async transformSlashCommandArgs(
    args: {[key: string]: any},
    interaction: Discord.CommandInteraction,
  ): Promise<{
      [key: string]: any
    }> {
    return args;
  }
}
