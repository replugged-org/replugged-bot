import * as Discord from "discord.js";
import { Command } from "../stuct/command.js";
import { CommandHelp, SlashCommandData } from "./command.js";

export class CustomClient extends Discord.Client {
  public events?: Discord.Collection<string, (client: CustomClient, ...args: unknown[]) => void>;
  public commands?: Discord.Collection<string, Command>;
  public help?: Discord.Collection<string, CommandHelp>;
  public slashCommands?: SlashCommandData[];
  public declare application: Discord.ClientApplication;
}

export interface Presence {
  text: string;
  type: Discord.ActivityType;
  status: Discord.PresenceStatusData;
}