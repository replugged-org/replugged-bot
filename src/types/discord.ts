import type { PrismaClient } from "@prisma/client";
import * as Discord from "discord.js";
import { Command } from "../stuct/command.js";
import { CommandHelp, SlashCommandData } from "./command.js";
import algoliasearch from "algoliasearch/lite.js";

export class CustomClient extends Discord.Client {
  public events?: Discord.Collection<string, (client: CustomClient, ...args: unknown[]) => void>;
  public commands?: Discord.Collection<string, Command>;
  public help?: Discord.Collection<string, CommandHelp>;
  public slashCommands?: SlashCommandData[];
  public prisma?: PrismaClient;
  public declare application: Discord.ClientApplication;
  public algolia?: algoliasearch.SearchIndex;
}

export interface Presence {
  text: string;
  type: Discord.ActivityType;
  status: Discord.PresenceStatusData;
}
