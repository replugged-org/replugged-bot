import * as Discord from "discord.js";
import dotenv from "dotenv";
import { CustomClient } from "./types/index.js";
import eventHandler from "./handlers/event.js";
import * as commandHandler from "./handlers/command.js";
import { readdirSync } from "fs";

dotenv.config({ path: "config.env" });

const dirname = new URL(".", import.meta.url).pathname;

const IntentFlags = Discord.IntentsBitField.Flags;

const client = new Discord.Client({
  intents: [
    IntentFlags.Guilds,
    IntentFlags.GuildMembers,
    IntentFlags.GuildPresences,
    IntentFlags.GuildMessages,
    IntentFlags.GuildMessageReactions,
    IntentFlags.GuildInvites,
  ],
}) as CustomClient;

client.commands = new Discord.Collection();
client.events = new Discord.Collection();
client.help = new Discord.Collection();

await Promise.all(
  readdirSync(`${dirname}commands`).map(async (c) => {
    if (!c.includes(".")) await commandHandler.load(client, c, false, false);
  }),
);

await eventHandler(client);

client.login(process.env.TOKEN).catch((e) => {
  console.log(e);
});
