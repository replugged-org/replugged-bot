import { GuildMember, Message } from "discord.js";
import { validateFlags } from "../helpers.js";
import { CustomClient } from "../types/index.js";

export default async (client: CustomClient, message: Message): Promise<void> => {
  if (message.author.bot || !message.guild) return;

  const member: GuildMember = await message.guild.members.fetch(message.author.id);  
  const db_user = await client.prisma?.users?.findFirst({ where: { discord_id: parseInt(message.author.id, 10) } });

  if (!db_user) {
    // Was used temporarily in order to  add people onto db easily, will be removed from this place soon.
    // await client.prisma?.users.create({
    //   data: {
    //     name: message.author.username,
    //     discriminator: message.author.discriminator,
    //     discord_id: parseInt(message.author.id, 10),
    //     avatar: message.author.avatarURL() ?? "",
    //     email: `${message.author.username}-${Math.random().toString(36).substring(2)}@replugged.com`,
    //     updated_at: new Date(),
    //   }
    // });
  } else if (db_user.name !== message.author.username || db_user.discriminator !== message.author.discriminator || db_user.avatar !== message.author.avatarURL()) {
    await client.prisma?.users.update({
      where: { discord_id: parseInt(message.author.id, 10) },
      data: {
        name: message.author.username,
        discriminator: message.author.discriminator,
        avatar: message.author.avatarURL() ?? "",
        updated_at: new Date(),
      }
    })
    
    const toggleRoles = validateFlags(db_user.flags, member);

    toggleRoles.forEach(async ([ hasRole, roleID ]) => {
      if (!hasRole) {
        await member.roles.add(roleID);
      } else {
        await member.roles.remove(roleID);
      }
    });
  } else {
    const toggleRoles = validateFlags(db_user.flags, member);

    toggleRoles.forEach(async ([ hasRole, roleID ]) => {
      if (!hasRole) {
        await member.roles.add(roleID);
      } else {
        await member.roles.remove(roleID);
      }
    });
  }
}
