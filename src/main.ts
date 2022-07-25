import { CommandClient } from 'eris';
import dotenv from 'dotenv';
import { basename } from 'path';
import { readdirRecursive } from './util.js';

dotenv.config({path: 'config.env'});

const bot = new CommandClient(
  // if it's undefined you're bad.
  process.env['DISCORD_TOKEN']!,
  {
    intents: ['guilds', 'guildBans', 'guildMembers', 'guildPresences', 'guildMessages', 'guildMessageReactions', 'guildInvites']
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

Promise.all([
  bot.connect(),
  readdirRecursive(new URL('./modules/', import.meta.url)).then((modules: string[]) => Promise.all(modules.map(loadModule))),
  readdirRecursive(new URL('./commands/', import.meta.url)).then((commands: string[]) => Promise.all(commands.map(loadCommand)))
]);

bot.on('ready', () => {
  console.log('Logged in as %s#%s', bot.user.username, bot.user.discriminator);
});

bot.on('error', (e) => console.error('Bot encountered an error', e));