import { Command } from '../stypes.js';

export default new Command({
  name: 'ping',
  description: 'Pong!',
  handler: async (interaction) => {
    await interaction.reply({
      content: 'Pong!',
      ephemeral: true,
    });
  }
});
