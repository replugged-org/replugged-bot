import * as Discord from 'discord.js';
import { Db } from 'mongodb';
import { Command } from '../stuct/command';
import { CommandHelp, SlashCommandData } from './command';

export class CustomClient extends Discord.Client {
  events?: Discord.Collection<string, Function>;
  commands?: Discord.Collection<string, Command>;
  aliases?: Discord.Collection<string, string>;
  help?: Discord.Collection<string, CommandHelp>;
  slashCommands?: SlashCommandData[];
  
  mongo?: Db;
}

export interface Presence {
  text: string,
  type: Discord.ActivityType,
  status: Discord.PresenceStatusData
}
