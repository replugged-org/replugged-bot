import { readdirSync } from "fs";
import { Command } from "../stuct/index.js";
import { CustomClient, SlashCommandData } from "../types/index.js";
import {
  ApplicationCommandOptionData,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputApplicationCommandData,
} from "discord.js";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
import { IDS } from "../constants.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export async function load(
  client: CustomClient,
  filePath: string,
  subcommand: string | false,
  reload: string | boolean | null,
): Promise<void> {
  const dev = process.env.NODE_ENV == "development";
  const serverID = (dev && IDS.server) || undefined;

  const commands = readdirSync(pathToFileURL(path.join(dirname, "../commands", filePath)));
  let slashCommands: SlashCommandData[] = [];
  let slashCommandSubcommands: Record<string, SlashCommandData> = {};
  for (let file of commands) {
    if (
      reload == false ||
      reload == null ||
      (typeof reload == "string" && file.replace(".js", "") == reload)
    ) {
      const name: string =
        subcommand && typeof subcommand == "string"
          ? file.split(".")[0] == "_"
            ? subcommand
            : `${subcommand}.${file.replace(".js", "")}`
          : file.replace(".js", "");
      if (file.endsWith(".js")) {
        const loaded = await import(
          `${pathToFileURL(path.join(dirname, "../commands", filePath, file)).href}?t=${Date.now()}`
        );
        if (loaded?.default) {
          const cmd: Command = new loaded.default();

          const { name } = cmd.config;
          if (cmd.help) {
            if (subcommand && file.split(".")[0] == "_") {
              cmd.help.subcommands = commands
                .filter((x) => x.split(".")[0] !== "_")
                .map((x) => x.replace(".js", ""));
            }
            client.help?.set(name, cmd.help);
          }

          client.commands?.set(name, cmd);

          if (
            (cmd.config.slashCommand && cmd.help.description) ||
            cmd.config.messageContextMenu ||
            cmd.config.userContextMenu
          ) {
            let types: ApplicationCommandType[] = [];
            if (cmd.config.messageContextMenu) types.push(ApplicationCommandType.Message);
            if (cmd.config.userContextMenu) types.push(ApplicationCommandType.User);
            if (cmd.config.slashCommand) types.push(ApplicationCommandType.ChatInput);

            let name = cmd.config.name.split(".").slice(-1)[0];

            if (name) {
              if (cmd.config.slashCommand && file.split(".")[0] == "_") {
                slashCommandSubcommands[name] = {
                  data: {
                    name,
                    description: cmd.help.description.replace(/`/g, ""),
                    type: ApplicationCommandType.ChatInput,
                    options: [],
                  },
                  guild: serverID,
                };
                subcommand = name;
              }
              if (cmd.config.slashCommand && subcommand) {
                const subcommand = slashCommandSubcommands[name]?.data as
                  | ChatInputApplicationCommandData
                  | undefined;
                if (subcommand) {
                  subcommand.options!.push({
                    type: ApplicationCommandOptionType.Subcommand,
                    name,
                    description: cmd.help.description.replace(/`/g, ""),
                    options: cmd.help.args,
                  } as ApplicationCommandOptionData);
                }
              } else {
                types.forEach((type) => {
                  slashCommands.push({
                    data: {
                      name,
                      description: cmd.help.description.replace(/`/g, ""),
                      type,
                      options: type == ApplicationCommandType.ChatInput ? cmd.help.args : undefined,
                    },
                    guild: serverID,
                  });
                });
              }
            } else if (cmd.config.slashCommand && file.split(".")[0] == "_") {
              slashCommandSubcommands[name] = {
                data: {
                  name,
                  description: cmd.help.description.replace(/`/g, ""),
                  type: ApplicationCommandType.ChatInput,
                  options: [],
                },
                guild: serverID,
              };
            }
          }
        }
      } else if (!file.includes(".")) {
        await load(client, `${filePath}/${file}`, name, reload == false ? false : null);
      }
    }
  }

  slashCommands.push(...Object.values(slashCommandSubcommands));
  if (!client.slashCommands) client.slashCommands = [];
  client.slashCommands.push(...slashCommands);
}
