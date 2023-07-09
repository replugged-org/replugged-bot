import * as Discord from "discord.js";
import {
  AutocompleteArgsType,
  AutocompleteReturnType,
  Command,
  CommandUse,
} from "../../stuct/index.js";
import algoliasearch from "algoliasearch";
import type { SearchOptions } from "@algolia/client-search";
import { DocSearchHit } from "../../types/algolia.js";
import { LOGO_URL } from "../../constants.js";

const { ALGOLIA_APP_ID, ALGOLIA_API_KEY, ALGOLIA_INDEX_NAME } = process.env;

const algolia =
  ALGOLIA_APP_ID && ALGOLIA_API_KEY && ALGOLIA_INDEX_NAME
    ? algoliasearch.default(ALGOLIA_APP_ID, ALGOLIA_API_KEY)
    : null;
const index = algolia?.initIndex("guide");

const ID_RESULT_PREFIX = "ID-";

// Mostly same config as the one in the client
const getSearchOptions = ({
  boldMarks,
  limit,
}: {
  boldMarks?: boolean;
  limit?: number;
} = {}): SearchOptions => {
  // Algolia wants some value here or it'll default to a HTML string so we'll use a zero-width space and remove it later
  const mark = boldMarks ? "**" : "\u200b";

  return {
    snippetEllipsisText: "…",
    highlightPreTag: mark,
    highlightPostTag: mark,
    hitsPerPage: limit ?? 5,
  };
};

interface Args {
  query: string;
  mention?: Discord.User;
}

export default class Guide extends Command {
  public constructor() {
    super({
      name: "guide",
      description: "Link to information in the Replugged Guide",
      category: "Replugged",
      args: [
        {
          name: "query",
          description: "What to search for",
          type: Discord.ApplicationCommandOptionType.String,
          autocomplete: true,
          required: true,
        },
        {
          name: "mention",
          description: "Ping a user in the response",
          type: Discord.ApplicationCommandOptionType.User,
          required: false,
        },
      ],
    });
  }

  public async run(command: CommandUse<Args>): Promise<void> {
    if (!index) {
      await command.sendMessage("Algolia is not configured");
      return;
    }

    const { args } = command;

    const { query, mention } = args;

    const result = query.startsWith(ID_RESULT_PREFIX)
      ? await index
          .getObject<DocSearchHit>(
            query.slice(ID_RESULT_PREFIX.length),
            getSearchOptions({ boldMarks: true, limit: 1 }),
          )
          .catch(() => null)
      : await index
          .search<DocSearchHit>(query, getSearchOptions({ limit: 1 }))
          .then((res) => res.hits[0])
          .catch(() => null);
    if (!result) {
      await command.sendMessage("No results found", {
        ephemeral: true,
      });
      return;
    }

    const pages = [...new Set(Object.values(result.hierarchy).slice(0, 2).filter(Boolean))];
    if (pages[0] === "Documentation") pages.shift();
    const headings = Object.values(result.hierarchy).slice(2).filter(Boolean);
    const hasHeadings = headings.length > 0;

    // Shown in the embed author
    const breadcrumbs = hasHeadings ? pages.join(" → ") : "Replugged Guide";
    // Shown in the embed title
    const title = (hasHeadings ? headings : pages).join(" → ");

    const userMention = mention ? Discord.userMention(mention.id) : "";
    await command.sendMessage({
      content: userMention,
      embeds: [
        new Discord.EmbedBuilder()
          .setAuthor({
            name: breadcrumbs,
            iconURL: LOGO_URL,
          })
          .setTitle(title)
          .setURL(result.url),
      ],
    });
  }

  public async autocomplete({
    name,
    value,
  }: AutocompleteArgsType<Args>): Promise<AutocompleteReturnType> {
    if (name !== "query") return null;
    if (!index) return null;

    const results = await index.search<DocSearchHit>(value, getSearchOptions());

    const uniqueHits = results.hits.filter(
      // Seems like we have some duplicate object IDs where some have a trailing slash and some don't
      (hit, index, self) =>
        self.findIndex((h) => h.objectID.replace(/\/$/, "") === hit.objectID.replace(/\/$/, "")) ===
        index,
    );

    return uniqueHits
      .map((hit): Discord.ApplicationCommandOptionChoiceData<string> | null => {
        const page = [...new Set(Object.values(hit.hierarchy).slice(0, 2).filter(Boolean))].join(
          " → ",
        );
        const heading = Object.values(hit.hierarchy).slice(2).filter(Boolean).at(-1);
        const name = heading ? `${heading} (${page})` : page;

        return {
          name,
          value: `${ID_RESULT_PREFIX}${hit.objectID}`,
        };
      })
      .filter(Boolean);
  }
}
