import * as Discord from "discord.js";
import {
  AutocompleteArgsType,
  AutocompleteReturnType,
  Command,
  CommandUse,
} from "../../stuct/index.js";

const BASE_URL = "https://guide.replugged.dev";

interface Args {
  query: string;
  mention?: Discord.User;
}

type Hits = Array<{
  objectID: string;
  url: string;
  hierarchy: Record<string, string | null>;
}>


export default class Guide extends Command {
  public constructor() {
    super({
      name: "guide",
      description: "Link to information in the Replugged Guide",
      category: "Replugged",
      args: [
        {
          name: "query",
          description: "The query to search for",
          type: Discord.ApplicationCommandOptionType.String,
          autocomplete: true,
          required: true,
        },
        {
          name: "mention",
          description: "Ping a user to link to their guide page",
          type: Discord.ApplicationCommandOptionType.User,
          required: false,
        },
      ],
    });
  }

  public async run(command: CommandUse<Args>): Promise<void> {
    const { args } = command;

    const { query, mention } = args;

    const userMention = mention ? `${Discord.userMention(mention.id)} ` : "";
    await command.sendMessage(`${userMention}${query}`);
  }

  public autocomplete({
    client,
    name,
    value,
  }: AutocompleteArgsType<Args>): AutocompleteReturnType {
    if (name !== "query") return null;

    return client.algolia?.search(value).then(({ hits }) => {
      return (hits as Hits).map((hit) => {
        let name = hit.hierarchy.lvl1;

        for (const lvl of Object.values(hit.hierarchy).slice(2)) {
          if (lvl) {
            name += ` → ${lvl}`;
          }
        }

        if (name) {
          return {
            name,
            value: hit.url,
          };
        } else {
          return {
            name: "No results found",
            value: "",
          };
        }
      }).filter(Boolean);
    }).catch(() => []); // fail silently
  }
}
