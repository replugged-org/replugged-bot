import { Interaction } from 'discord.js';
import dotenv from 'dotenv';
import { Db, MongoClient } from 'mongodb';
import { CustomClient } from './types';

dotenv.config({path: 'config.env'});

const mongo: Db = await (new MongoClient('mongodb://127.0.0.1:27017')).connect().then(c => c.db('replugged'));

const client = new CustomClient(
  {
    intents: ['Guilds', 'GuildBans', 'GuildMembers', 'GuildPresences', 'GuildMessages', 'GuildMessageReactions', 'GuildInvites'],
  }
);

client.mongo = mongo;

await client.login(process.env.TOKEN);

client.on('ready', () => {
  console.log('Logged in as %s#%s', client?.user?.username, client?.user?.discriminator);
});

client.on('error', (e) => console.error('Bot encountered an error', e));