import { ApplicationCommandOptionType } from "discord.js";
import { Command, CommandUse } from "../../../stuct/index.js";
import { GITHUB_RGX } from "../../../constants.js";
import { CommandFlags } from "../../../types/command.js";

export default class Diff extends Command {
  public constructor() {
    super({
      name: "addon.diff",
      description: "get the difference between releases",
      category: "Replugged",
      args: [
        {
          name: "repoid",
          description: "The repo to compare",
          type: ApplicationCommandOptionType.String,
        },
      ],
      flags: [CommandFlags.STAFF],
    });
  }

  public async run(command: CommandUse<Record<string, never>>): Promise<void> {
    const { interaction, args } = command;

    let repoId = args.repoid as string;

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

      const releasesRes = await fetch(`https://api.github.com/repos/${repoId}/releases`, {
        headers,
      });

      if (!releasesRes.ok) {
        console.error("Error getting release", await releasesRes.text()); // May have sensitive info so we won't share it in Discord
        await command.sendMessage("Error getting release");
        return;
      }
      const releases = (await releasesRes.json()).sort(
        (a: Record<string, string>, b: Record<string, string>) => {
          const aDate = new Date(a.published_at);
          const bDate = new Date(b.published_at);
          return bDate.getTime() - aDate.getTime();
        },
      );
      const firstRelease = releases[0];
      if (!firstRelease) {
        await command.sendMessage("No releases found");
        return;
      }
      const firstReleaseName = firstRelease.name;
      const asarAssets = firstRelease.assets.filter((x: Record<string, string>) =>
        x.name.endsWith(".asar"),
      );
      const isNotByAction = asarAssets.some(
        (x: Record<string, Record<string, string>>) => x.uploader.login !== "github-actions[bot]",
      );
      const isModified = asarAssets.some(
        (x: Record<string, string>) =>
          Math.abs(new Date(x.created_at).getTime() - new Date(x.updated_at).getTime()) > 1000 ||
          Math.abs(
            new Date(x.created_at).getTime() - new Date(firstRelease.published_at).getTime(),
          ) > 1000,
      );
      const firstReleaseTag = firstRelease.tag_name;
      const secondRelease = releases[1];
      if (!secondRelease) {
        await command.sendMessage("No second release found");
        return;
      }
      const secondReleaseName = secondRelease.name;
      const secondReleaseTag = secondRelease.tag_name;

      const tagsRes = await fetch(`https://api.github.com/repos/${repoId}/tags`, {
        headers,
      });
      if (!tagsRes.ok) {
        console.error("Error getting tags", await tagsRes.text()); // May have sensitive info so we won't share it in Discord
        await command.sendMessage("Error getting tags");
        return;
      }

      const json = await tagsRes.json();
      const firstTag = json.find((tag: Record<string, string>) => tag.name === firstReleaseTag);
      if (!firstTag) {
        await command.sendMessage(
          `Could not find tag ${firstReleaseTag} for release ${firstReleaseName}`,
        );
        return;
      }
      const firstCommit = firstTag.commit.sha;
      const secondTag = json.find((tag: Record<string, string>) => tag.name === secondReleaseTag);
      if (!secondTag) {
        await command.sendMessage(
          `Could not find tag ${secondReleaseTag} for release ${secondReleaseName}`,
        );
        return;
      }
      const secondCommit = secondTag.commit.sha;

      const diffUrl = `https://github.com/${repoId}/compare/${secondCommit}...${firstCommit}`;
      await command.sendMessage(
        `Update from ${secondReleaseName} to ${firstReleaseName}: <${diffUrl}>${
          isNotByAction ? "\n:warning: Asar was not released by GitHub Actions." : ""
        }${isModified ? "\n:warning: Asar was modified after release." : ""}`,
      );
    } catch {}
  }
}
