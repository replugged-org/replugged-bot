import * as Discord from "discord.js";
import { Command } from "../stuct/index.js";
import { CustomClient } from "./discord.js";

export interface CommandInput {
  message: Discord.Message;
  args: { [key: string]: string };
  author: Discord.User | Discord.PartialUser;
  member: Discord.GuildMember | null;
  client: CustomClient;
  guild: Discord.Guild;
  channel: Discord.TextChannel | Discord.NewsChannel | Discord.ThreadChannel | Discord.DMChannel;
  content: string;
}

export interface CommandUsage<Args> {
  command: Command;
  args: Args;
  interaction: Discord.CommandInteraction;
}

export interface CommandHelp {
  name: string;
  description: string;
  mainCommandDescription?: string;
  category?: string;
  args: Discord.ApplicationCommandOptionData[];
  examples: string[];
  subcommands?: string[];
  hidden: boolean;
  slashCommand: boolean;
  textCommand: boolean;
  userContextMenu: boolean;
  messageContextMenu: boolean;
}

export interface CommandConfig {
  name: string;
  flags: CommandFlags[];
  cooldown: number;
  limit: number;
  slashCommand: boolean;
  textCommand: boolean;
  userContextMenu: boolean;
  messageContextMenu: boolean;
  subCommandName?: string;
}

export interface CommandOptions {
  name: string;
  description: string;
  mainCommandDescription?: string;
  category?: string;
  args?: Discord.ApplicationCommandOptionData[];
  examples?: string[];
  flags?: CommandFlags[];
  cooldown?: number;
  limit?: number;
  hidden?: boolean;
  slashCommand?: boolean;
  textCommand?: boolean;
  userContextMenu?: boolean;
  messageContextMenu?: boolean;
  subCommandName?: string;
}

export type CommandFlags = "dev" | "support" | "admin";

export interface CanUse {
  canUse: boolean;
  responseMessage: Discord.BaseMessageOptions | null;
}

export interface CommandPermissions {
  name?: string;
  exists?: boolean;
  configured?: boolean;
  enabled?: boolean;
  disableable?: boolean;
  roleMode?: 0 | 1 | 2;
  roles?: string[];
  channelMode?: 0 | 1 | 2;
  channels?: string[];
  _id?: string;
}

export interface CommandResponseOptions {
  reply?: boolean;
  replyPing?: boolean;
  escapeMentions?: boolean;
  escapeEveryone?: boolean;
  userMentions?: Array<`${bigint}`> | null;
  roleMentions?: Array<`${bigint}`> | null;
  saveOutput?: boolean;
  editOutput?: boolean;
  ephemeral?: boolean;
}

export type CommandUseType = "SLASH" | "TEXT";

export type ButtonMenuEndAction = "NONE" | "DISABLE_BUTTONS" | "REMOVE_BUTTONS";

export interface SlashCommandData {
  data: Discord.ApplicationCommandData;
  guild: Discord.Snowflake | undefined;
}