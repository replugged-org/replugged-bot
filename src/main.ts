import { CommandClient } from 'eris';
import dotenv from 'dotenv';
import { basename } from 'path';
import { readdirRecursive } from './util.js';
import { MongoClient } from 'mongodb';

dotenv.config({path: 'config.env'});

const bot = new CommandClient(
  // if it's undefined you're bad.
  process.env['DISCORD_TOKEN']!,
  {
    intents: ['guilds', 'guildBans', 'guildMembers', 'guildPresences', 'guildMessages', 'guildMessageReactions', 'guildInvites'],
    restMode: true
  },
  { 
    defaultHelpCommand: false,
    prefix: process.env['PREFIX']
  }
);

/**
 * 
 * @param module Path to the module
 */
async function loadModule(module: string) {
  if(!module.endsWith('.js')) return;

  const mod = await import(module);
  if(mod.__skip) return;

  if(typeof mod.default !== 'function') throw new TypeError(`Invalid Module: ${basename(module)}`);

  mod.default(bot);
}

/**
 * 
 * @param command Path to the command
 */
async function loadCommand(command: string) {
  if(!command.endsWith('.js')) return;

  const cmd = await import(command);
  if(cmd.__skip) return;

  if(typeof cmd.executor !== 'function') throw new TypeError(`Invalid Command: ${basename(command)}`);
  bot.registerCommand(
    basename(command, '.js'), 
    cmd.executor, 
    {
      description: cmd.description, 
      aliases: cmd.aliases
    }
  );
}

Promise.resolve(new MongoClient('mongodb://127.0.0.1:27017'))
  .then((client) => client.connect())
  .then((client) => (bot.mango = client.db('replugged')))
  .then(() => readdirRecursive(new URL('./modules/', import.meta.url)))
  .then((modules: string[]) => Promise.all(modules.map(loadModule)))
  .then(() => readdirRecursive(new URL('./commands/', import.meta.url)))
  .then((commands: string[]) => Promise.all(commands.map(loadCommand)).catch((e) => console.error(e)))
  .then(() => bot.connect())
  .catch((e: Error) => console.error('An error occured during startup lol', e));

bot.on('ready', () => {
  console.log('Logged in as %s#%s', bot.user.username, bot.user.discriminator);
});

bot.on('error', (e) => console.error('Bot encountered an error', e));