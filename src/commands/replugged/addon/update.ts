import path from "path";
import { writeFile } from "fs/promises";
import { ApplicationCommandOptionType } from "discord.js";
import { Command, CommandUse } from "../../../stuct/index.js";
import { createDirForFile } from "../../../helpers.js";
import { ADDONS_FOLDER, GITHUB_RGX } from "../../../constants.js";

export default class Update extends Command {
  public constructor() {
    super({
      name: "addon.update",
      description: "update the repo in store",
      category: "Replugged",
      args: [
        {
          name: "repoid",
          description: "The repo to compare",
          type: ApplicationCommandOptionType.String,
        },
        {
          name: "addonid",
          description: "The addon to update",
          type: ApplicationCommandOptionType.String,
        },
      ],
      flags: ["dev"],
    });
  }

  public async run(command: CommandUse<Record<string, never>>): Promise<void> {
    const { interaction, args } = command;

    let repoId = args.repoid as string;
    let addonId = args.addonid as string;

    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let errorMsg = `Usage: ${process.env.PREFIX}diff [repo]`;

    try {
      if (!repoId) {
        if (interaction.channel?.type === 11) {
          const firstMessage = await interaction.channel.messages.fetch(interaction.channel.id);
          if (firstMessage) {
            const content = firstMessage.content || "";
            const match = content.matchAll(GITHUB_RGX);
            const matches = [...match];
            if (matches.length === 1) {
              repoId = matches[0][1];
            }
            if (matches.length > 1) {
              errorMsg = "Multiple repos found in thread, must specify";
            }
          }
        }
      }

      if (!repoId) {
        await command.sendMessage(errorMsg);
        return;
      }

      const res = await fetch(`https://api.github.com/repos/${repoId}/releases/latest`, {
        headers,
      });
      if (!res.ok) {
        console.error("Error getting release", await res.text()); // May have sensitive info so we won't share it in Discord
        await command.sendMessage("Error getting release");
        return;
      }
      const release = await res.json();
      const manifestAssets = release.assets.filter((asset: Record<string, string>) => {
        if (addonId) {
          return asset.name === `${addonId}.json`;
        }

        return asset.name.endsWith(".json");
      });
      if (manifestAssets.length === 0) {
        await command.sendMessage("No manifest found");
        return;
      }
      if (manifestAssets.length > 1) {
        await command.sendMessage(
          `Multiple manifests found, please specify addon id. Found: ${manifestAssets
            .map((asset: Record<string, string>) => asset.name.replace(/\.json$/, ""))
            .join(", ")}`,
        );
        return;
      }
      const manifestAddonId = manifestAssets[0].name.replace(/\.json$/, "");
      const manifestUrl = manifestAssets[0].browser_download_url;
      const asarAsset = release.assets.find(
        (asset: Record<string, string>) => asset.name === `${manifestAddonId}.asar`,
      );
      if (!asarAsset) {
        await command.sendMessage(`No asar found for ${manifestAddonId}`);
        return;
      }
      const asarUrl = asarAsset.browser_download_url;

      const manifestRes = await fetch(manifestUrl, {
        headers,
      }).then((res) => res.json());
      const { id, version } = manifestRes;
      manifestRes.updater = {
        type: "store",
        id,
      };
      const asarRes = await fetch(asarUrl, {
        headers,
      }).then((res) => res.arrayBuffer());
      const manifestPath = path.join(ADDONS_FOLDER, "manifests", `${manifestAddonId}.json`);
      const asarPath = path.join(ADDONS_FOLDER, "asars", `${manifestAddonId}.asar`);
      [manifestPath, asarPath].forEach(createDirForFile);
      await writeFile(manifestPath, JSON.stringify(manifestRes, null, 2));
      await writeFile(asarPath, Buffer.from(asarRes));
      await command.sendMessage(`Added/updated ${id} (${version}).`);
    } catch {}
  }
}
