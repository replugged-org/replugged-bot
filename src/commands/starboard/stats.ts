import { EmbedBuilder } from "discord.js";
import { Command, CommandUse } from "../../stuct/index.js";
import { BOARD_MINIMUM, EMOTES } from "../../utils/starboard.js";

export default class Stats extends Command {
  public constructor() {
    super({
      name: "starboard.stats",
      description: "get your starboard stats",
      category: "Starboard",
    });
  }

  public async run(command: CommandUse<Record<string, never>>): Promise<void> {
    const { client, interaction } = command;

    const starred = (await client.prisma?.starboard.findMany({
      where: { authorId: interaction.user.id },
    }))?.filter((star) => star.starcount > 0);

    const stars = starred?.map((star) => star.starcount).reduce((a, b) => a + b, 0) || 0;
    const timesOnStarboard = starred?.filter((star) => star.starcount >= BOARD_MINIMUM).length || 0;
    const mostStarred = starred?.sort((a, b) => b.starcount - a.starcount)[0];
    
    const [, star, color] = EMOTES.filter((e) => e[0] <= stars).pop()!;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.avatarURL() || undefined,
      })
      .setTitle("Starboard Stats")
      .setColor(color)
      .setDescription(`
      **${star} Stars:** ${stars}
      **Times On Starboard:** ${timesOnStarboard}
      **Number of Starred Messages:** ${starred?.length}

      ${mostStarred ? `**Most Starred Message:** [${mostStarred?.starcount}](https://discord.com/channels/${interaction.guildId}/${mostStarred?.channelId}/${mostStarred?.messageId})` : ""}
      `)

    await command.sendEmbed(embed);
  }
}
