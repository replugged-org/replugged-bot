import {
  ApplicationCommandOptionType,
  Client,
  InteractionCollector,
  InteractionReplyOptions,
  MessageEditOptions,
  MessageFlags,
  User,
} from "discord.js";
import { Command, CommandUse } from "../../stuct/index.js";
import { UserFlagKeys, UserFlags, UserFlagsArray } from "../../constants.js";
import { users } from "@prisma/client";
import { CommandFlags } from "../../types/command.js";

const ROWS_PER_PAGE = 3;
const BUTTONS_PER_ROW = 5;
const BUTTONS_PER_PAGE = ROWS_PER_PAGE * BUTTONS_PER_ROW;
const NUM_PAGES = Math.ceil(UserFlagsArray.length / BUTTONS_PER_PAGE);

export default class SetRoles extends Command {
  public constructor() {
    super({
      name: "setroles",
      description: "set the roles of a user",
      category: "Replugged",
      args: [
        {
          name: "user",
          description: "User to set roles for",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
      ],
      flags: [CommandFlags.ADMIN],
    });
  }

  public async run(command: CommandUse<Record<string, User>>): Promise<void> {
    const { client, args } = command;

    const target = args.user || command.author;

    let db_user = await client.prisma?.users.findFirst({
      where: { discord_id: target.id },
    });

    if (!db_user) {
      await command.sendMessage("User not found");
      return;
    }

    let page = 0;
    let { flags } = db_user;

    const reply = await command.sendMessage(this.genMessage(db_user, 0));

    if (!reply) return;

    new InteractionCollector(client as Client<true>, {
      time: 30 * 1000,
      message: reply,
    })
      .on("collect", async (interaction) => {
        if (!db_user) {
          await reply.edit("Something went wrong!");
          return;
        }
        if (interaction.member?.user.id !== command.author.id) {
          await interaction.reply({
            content: "NOPE",
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const id = interaction.customId;
        if (id === "back") page--;
        else if (id === "next") page++;
        else if (id.startsWith("toggle-")) {
          const flag = id.substring("toggle-".length) as UserFlagKeys;
          if (target.id === command.author.id && flag === "ADMIN") {
            await interaction.reply({
              content: "don't remove your own admin flag",
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
          flags ^= UserFlags[flag];
        }

        await interaction.deferUpdate();
        db_user.flags = flags;
        db_user = await client.prisma?.users.update({
          where: { discord_id: target.id },
          data: {
            flags,
          },
        });
        if (!db_user) {
          await reply.edit("Something went wrong!");
          return;
        }

        await reply.edit(this.genMessage(db_user, page) as MessageEditOptions);
      })
      .on("end", async () => {
        if (!db_user) {
          await reply.edit("Something went wrong!");
          return;
        }
        await reply.edit(this.genMessage(db_user, page, true) as MessageEditOptions);
      });
  }

  private genMessage(user: users, page: number, disabled = false): InteractionReplyOptions {
    const pageFlags = UserFlagsArray.slice(page * BUTTONS_PER_PAGE, (page + 1) * BUTTONS_PER_PAGE);
    const rows: Array<typeof UserFlagsArray> = [];
    for (let i = 0; i < ROWS_PER_PAGE; i++) {
      rows.push(pageFlags.slice(i * BUTTONS_PER_ROW, (i + 1) * BUTTONS_PER_ROW));
    }

    return {
      content: `Set roles on <@${user.discord_id}>`,
      allowedMentions: {
        users: [],
      },
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              label: "Back",
              custom_id: "back",
              disabled: disabled || page === 0,
            },
            {
              type: 2,
              style: 2,
              label: `Page ${page + 1}/${NUM_PAGES}`,
              custom_id: "null",
              disabled: disabled || true,
            },
            {
              type: 2,
              style: 3,
              label: "Next",
              custom_id: "next",
              disabled: disabled || page === NUM_PAGES - 1,
            },
          ],
        },
        ...rows.map((row) => ({
          type: 1,
          components: row.map((flag) => ({
            type: 2,
            style: user.flags & flag.value ? 1 : 2,
            label: flag.label,
            custom_id: `toggle-${flag.key}`,
            disabled,
          })),
        })),
      ],
    };
  }
}
