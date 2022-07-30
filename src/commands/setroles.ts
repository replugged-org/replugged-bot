import { ActionRow, Constants, GuildTextableChannel, Message, MessageContent } from 'eris';
import { Collection } from 'mongodb';
import { UserFlagKeys, UserFlags, UserFlagsArray, UserFlagsValues } from '../constants.js';
import { User as DBUser } from '../db.js';
import { InteractionCollector } from '../util.js';

export const description = 'Forg';

async function upsertUser(collection: Collection<DBUser>, id: string, data: Partial<DBUser>) {
  const res = await collection.findOneAndUpdate(
    { _id: id },
    {
		  $currentDate: { updatedAt: true },
		  $min: { createdAt: new Date() },
      $set: data
    },
    { upsert: true, returnDocument: 'after'}
  );
  return res.value!;
}

const ROWS_PER_PAGE = 3;
const BUTTONS_PER_ROW = 5;
const BUTTONS_PER_PAGE = ROWS_PER_PAGE * BUTTONS_PER_ROW;
const NUM_PAGES = Math.ceil(UserFlagsArray.length / BUTTONS_PER_PAGE);

function genMessage(user: DBUser, page: number, disabled: boolean = false): MessageContent {
  const pageFlags = UserFlagsArray.slice(page * BUTTONS_PER_PAGE, (page + 1) * BUTTONS_PER_PAGE);
  const rows: (typeof UserFlagsArray)[] = [];
  for (let i = 0; i < ROWS_PER_PAGE; i++) {
    rows.push(pageFlags.slice(i * BUTTONS_PER_ROW, (i + 1) * BUTTONS_PER_ROW));
  }

  return {
    content: `Set roles on <@${user._id}>`,
    allowedMentions: {
      users: []
    },
    components: [{
      type: 1,
      components: [{
        type: 2,
        style: 3,
        label: 'Back',
        custom_id: 'back',
        disabled: disabled || page === 0,
      }, {
        type: 2,
        style: 2,
        label: `Page ${page + 1}/${NUM_PAGES}`,
        custom_id: 'null',
        disabled: disabled || true,
      }, {
        type: 2,
        style: 3,
        label: 'Next',
        custom_id: 'next',
        disabled: disabled || page === NUM_PAGES - 1,
      }]
    }, ...rows.map(row => ({
      type: 1,
      components: row.map(flag => ({
        type: 2,
        style: user.flags & flag.value ? 1 : 2,
        label: flag.label,
        custom_id: `toggle-${flag.key}`,
        disabled
      }))
    }) as ActionRow)]
  };
}

export async function executor(msg: Message<GuildTextableChannel>, args: string[]) {
  const client = msg._client;
  const dbCollection = client.mango.collection<DBUser>('users');
  const dbAuthor = await dbCollection.findOne({_id: msg.author.id});
  if (!dbAuthor || (dbAuthor.flags & UserFlags.ADMIN) === 0) return msg.channel.createMessage('nope');

  let targetText = args[0];
  if (!targetText) return msg.channel.createMessage('no user specified');
  const match = targetText.match(/^<@!?(\d+)>$/);
  if (match) targetText = match[1];

  const target = client.users.get(targetText) ?? await client.getRESTUser(targetText);
  if (!target) return msg.channel.createMessage('no user found');
  let dbTarget = await upsertUser(dbCollection, target.id, {
    username: target.username,
    discriminator: target.discriminator,
    avatar: target.avatar,
  });

  let page = 0;
  let flags = dbTarget.flags;

  const sent = await msg.channel.createMessage(genMessage(dbTarget, page));

  new InteractionCollector(sent, {
    timeout: 30 * 1000
  })
    .on('interaction', async (interaction) => {
      if (interaction.member?.id !== msg.author.id) return interaction.createMessage({
        content: 'nope',
        flags: Constants.MessageFlags.EPHEMERAL
      });


      const id = interaction.data.custom_id;
      if (id === 'back') page--;
      else if (id === 'next') page++;
      else if (id.startsWith('toggle-')) {
        const flag = id.substring('toggle-'.length) as UserFlagKeys;
        if (target.id == msg.author.id && flag === 'ADMIN') return interaction.createMessage({
          content: 'don\'t remove your own admin flag',
          flags: Constants.MessageFlags.EPHEMERAL
        });
        flags ^= UserFlags[flag] as UserFlagsValues;
        dbTarget = await upsertUser(dbCollection, target.id, { flags });
      }

      interaction.deferUpdate();
      sent.edit(genMessage(dbTarget, page));
    })
    .on('end', () => {
      sent.edit(genMessage(dbTarget, page, true));
    });
}