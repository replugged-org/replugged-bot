import * as Discord from "discord.js";
import { Command, CommandUse } from "../../stuct/index.js";

export default class Ping extends Command {
  public constructor() {
    super({
      name: "ping",
      description: "See Bot Response Time",
      category: "Information",
      args: [],
    });
  }

  public async run(command: CommandUse<Record<string, never>>): Promise<void> {
    const { client, interaction } = command;
    const { createdTimestamp } = interaction;

    try {
      const embed = new Discord.EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Ping")
        .setDescription(`🏓 Pong!`);

      await command.sendEmbed(embed, {
        saveOutput: true,
      });
      if (!command.output) return;

      const roundtrip = Math.round(command.output.createdTimestamp - createdTimestamp);
      const clientPing = Math.round(client.ws.ping);

      let newDescription = embed.data.description || "";

      newDescription += "\n";
      newDescription += `\nMessage Roundtrip: \`${roundtrip.toLocaleString()}\`ms`;
      newDescription += `\nWebsocket Ping: \`${clientPing.toLocaleString()}\`ms`;

      embed.setDescription(newDescription);

      await command.sendEmbed(embed, { editOutput: true });
    } catch {}
  }
}
