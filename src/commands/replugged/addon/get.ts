import * as Discord from "discord.js";
import {
  AutocompleteArgsType,
  AutocompleteReturnType,
  Command,
  CommandUse,
} from "../../../stuct/index.js";
import { ADDONS_FOLDER } from "../../../constants.js";
import { readFile, readdir } from "fs/promises";
import { join } from "path";

interface Args {
  addon: string;
}

interface Manifest {
  // Only what's needed
  id: string;
  name: string;
  description: string;
  version: string;
  type: string;

  author: {
    name: string;
    discordID?: string;
    github?: string;
  };
  image: string | string[];
  source?: string;
}

async function getAllAddons(): Promise<Manifest[]> {
  let addons = [];

  const files = await readdir(join(ADDONS_FOLDER, "manifests"));
  for (const fileName of files) {
    let json = JSON.parse(await readFile(join(ADDONS_FOLDER, "manifests", fileName), "utf8"));

    addons.push(json);
  }
  return addons;
}

async function getAddon(id: string): Promise<Manifest | null> {
  const files = await readdir(join(ADDONS_FOLDER, "manifests"));
  for (const fileName of files) {
    let json = JSON.parse(await readFile(join(ADDONS_FOLDER, "manifests", fileName), "utf8"));
    if (json.id === id) {
      return json;
    }
  }

  return null;
}

export default class AddonGet extends Command {
  public constructor() {
    super({
      name: "addon.get",
      description: "Addon commands",
      category: "Replugged",
      args: [
        {
          name: "addon",
          description: "The addonid to lookup",
          type: Discord.ApplicationCommandOptionType.String,
          autocomplete: true,
          required: true,
        },
      ],
    });
  }

  public async run(command: CommandUse<Record<string, never>>): Promise<void> {
    const { client, args } = command;

    let addon: Manifest | null = null;

    try {
      addon = await getAddon(args.addon);
    } catch {
      await command.sendMessage("Addon not found", {
        ephemeral: true,
      });

      return;
    }
    if (!addon) {
      await command.sendMessage("Addon not found", {
        ephemeral: true,
      });
      return;
    }
    
    addon.type = addon.type === "replugged-plugin" ? "Plugin" : "Theme"

    const embed = new Discord.EmbedBuilder()
      .setTitle(addon.name)
      .setDescription(
        `${addon.description}

      ${addon.source && `[Source Code](${addon.source})`}
      [Install ${addon.type}](https://replugged.dev/install?identifier=${addon.id})
      `,
      )
      .setColor(0x0099ff);

    let user: Discord.User | null = null;
    if (addon.author.discordID) {
      user = await client.users.fetch(addon.author.discordID);
    }
    embed.setAuthor({
      name: addon.author.name,
      iconURL: user?.avatarURL() || "",
      url: addon.author.github && `https://github.com/${addon.author.github}`,
    });

    if (Array.isArray(addon.image)) {
      embed.setImage(addon.image[0]);
    } else {
      embed.setImage(addon.image);
    }

    embed.setFooter({
      text: `Version: ${addon.version}`,
    });

    await command.sendEmbed(embed);
  }

  public autocomplete({ name, value }: AutocompleteArgsType<Args>): AutocompleteReturnType {
    if (name !== "addon") return [];

    return getAllAddons().then((addons) => {
      return addons
        .map((addon) => {
          return {
            name: `${addon.type === "replugged-plugin" ? "Plugin" : "Theme"}: ${addon.id} - v${
              addon.version
            }`,
            value: addon.id,
          };
        })
        .filter((addon) => addon.name.toLowerCase().includes(value.toLowerCase()));
    });
  }
}
