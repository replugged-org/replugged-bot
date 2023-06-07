import * as Discord from "discord.js";
import {
  AutocompleteArgsType,
  AutocompleteReturnType,
  Command,
  CommandUse,
} from "../../stuct/index.js";

const BASE_URL = "https://guide.replugged.dev";

interface Searchable {
  name: string;
  keywords?: string[];
}

interface PageHeading extends Searchable {
  hash: string;
}

interface Page extends Searchable {
  path: string;
  headings?: PageHeading[];
}

interface Args {
  page: string;
  heading?: string;
  mention?: Discord.User;
}

const PAGES: Page[] = [
  {
    path: "/docs/plugins/getting-started",
    name: "Plugins - Getting Started",
    headings: [
      {
        name: "Prerequisites",
        hash: "#prerequisites",
      },
      {
        name: "Creating a plugin",
        hash: "#creating-a-plugin",
        keywords: ["create"],
      },
      {
        name: "Installing",
        hash: "#installing",
      },
      {
        name: "Customizing your plugin",
        hash: "#customizing-your-plugin",
        keywords: ["customize", "id", "manifest"],
      },
      {
        name: "Development",
        hash: "#development",
      },
      {
        name: "Building, updating, and releasing",
        hash: "#building-updating-and-releasing",
        keywords: ["build", "update", "release"],
      },
      {
        name: "Sharing your plugin",
        hash: "#sharing-your-plugin",
        keywords: ["share"],
      },
    ],
  },
  {
    path: "/docs/plugins/modules",
    name: "Webpack Modules",
    headings: [
      {
        name: "Finding modules",
        hash: "#finding-modules",
      },
      {
        name: "Common modules",
        hash: "#common-modules",
      },
      {
        name: "Get module",
        hash: "#getModule",
        keywords: ["getModule"],
      },
      {
        name: "Wait for module",
        hash: "#waitForModule",
        keywords: ["waitForModule"],
      },
      {
        name: "Get by props",
        hash: "#getByProps",
        keywords: ["getByProps"],
      },
      {
        name: "Wait for props",
        hash: "#waitForProps",
        keywords: ["waitForProps"],
      },
      {
        name: "Get by source",
        hash: "#getBySource",
        keywords: ["getBySource"],
      },
      {
        name: "Get by ID",
        hash: "#get-by-id",
        keywords: ["getById"],
      },
      {
        name: "Processing modules",
        hash: "#processing-modules",
      },
      {
        name: "Get export for props",
        hash: "#getExportForProps",
        keywords: ["getExportForProps"],
      },
      {
        name: "Get function by source",
        hash: "#getFunctionBySource",
        keywords: ["getFunctionBySource"],
      },
      {
        name: "Get function key by source",
        hash: "#getFunctionKeyBySource",
        keywords: ["getFunctionKeyBySource"],
      },
      {
        name: "Options",
        hash: "#options",
      },
      {
        name: "all",
        hash: "#all",
        keywords: ["all", "option.all"],
      },
      {
        name: "raw",
        hash: "#raw",
        keywords: ["raw", "option.raw"],
      },
      {
        name: "timeout",
        hash: "#timeout",
        keywords: ["timeout", "option.timeout"],
      },
    ],
  },
  {
    path: "/docs/plugins/injecting",
    name: "Injecting into Modules",
    keywords: ["injector"],
    headings: [
      {
        name: "Plugin Lifecycle",
        hash: "#plugin-lifecycle",
      },
      {
        name: "Creating an Injector",
        hash: "#creating-an-injector",
        keywords: ["create"],
      },
      {
        name: "Injecting into a Module",
        hash: "#injecting-into-a-module",
      },
      {
        name: "before",
        hash: "#before",
        keywords: ["before", "injector.before"],
      },
      {
        name: "instead",
        hash: "#instead",
        keywords: ["instead", "injector.instead"],
      },
      {
        name: "after",
        hash: "#after",
        keywords: ["after", "injector.after"],
      },
      {
        name: "Comparison",
        hash: "#comparison",
      },
      {
        name: "Removing an Injection",
        hash: "#removing-an-injection",
        keywords: ["remove", "uninject"],
      },
    ],
  },
  {
    path: "/docs/plugins/settings",
    name: "Plugin Settings",
    keywords: ["settings", "config", "cfg"],
    headings: [
      {
        name: "Creating a settings manager",
        hash: "#creating-a-settings-manager",
      },
      {
        name: "Type hints",
        hash: "#type-hints",
        keywords: ["types", "typescript"],
      },
      {
        name: "Default settings",
        hash: "#default-settings",
      },
      {
        name: "Interacting with the settings manager",
        hash: "#interacting-with-the-settings-manager",
      },
      {
        name: "Get a value",
        hash: "#get",
        keywords: ["get"],
      },
      {
        name: "Set a value",
        hash: "#set",
        keywords: ["set"],
      },
      {
        name: "Delete a value",
        hash: "#delete",
        keywords: ["delete"],
      },
      {
        name: "Check if a value exists",
        hash: "#has",
        keywords: ["has"],
      },
      {
        name: "Get all values",
        hash: "#all",
        keywords: ["all"],
      },
      {
        name: "Settings page",
        hash: "#settings-page",
        keywords: ["page", "ui"],
      },
      {
        name: "useSetting hook",
        hash: "#usesetting-hook",
      },
      {
        name: "Input components",
        hash: "#input-components",
      },
    ],
  },
  {
    path: "/docs/plugins/components",
    name: "Components",
    keywords: ["elements", "components", "ui"],
    headings: [
      {
        name: "Input components",
        hash: "#input-components",
      },
      {
        name: "Checkbox and CheckboxItem",
        hash: "#checkbox-and-checkboxitem",
      },
      {
        name: "Radio and RadioItem",
        hash: "#radio-and-radioitem",
      },
      {
        name: "Select and SelectItem",
        hash: "#select-and-selectitem",
      },
      {
        name: "Slider and SliderItem",
        hash: "#slider-and-slideritem",
      },
      {
        name: "Switch and SwitchItem",
        hash: "#switch-and-switchitem",
      },
      {
        name: "TextArea",
        hash: "#textarea",
      },
      {
        name: "TextInput",
        hash: "#textinput",
        keywords: ["input"],
      },
      {
        name: "Other components",
        hash: "#other-components",
      },
      {
        name: "Button and ButtonItem",
        hash: "#button-and-buttonitem",
      },
      {
        name: "Category",
        hash: "#category",
      },
      {
        name: "Clickable",
        hash: "#clickable",
      },
      {
        name: "ContextMenu",
        hash: "#contextmenu",
      },
      {
        name: "Divider",
        hash: "#divider",
      },
      {
        name: "ErrorBoundary",
        hash: "#errorboundary",
      },
      {
        name: "Flex",
        hash: "#flex",
      },
      {
        name: "FormNotice",
        hash: "#formnotice",
      },
      {
        name: "FormItem",
        hash: "#formitem",
      },
      {
        name: "FormText",
        hash: "#formtext",
      },
      {
        name: "Loader",
        hash: "#loader",
      },
      {
        name: "Modal",
        hash: "#modal",
      },
      {
        name: "Notice",
        hash: "#notice",
      },
      {
        name: "Text",
        hash: "#text",
      },
      {
        name: "Tooltip",
        hash: "#tooltip",
      },
    ],
  },
  {
    path: "/docs/themes/getting-started",
    name: "Themes - Getting Started",
    headings: [
      {
        name: "Prerequisites",
        hash: "#prerequisites",
      },
      {
        name: "Creating a theme",
        hash: "#creating-a-theme",
        keywords: ["create"],
      },
      {
        name: "Installing",
        hash: "#installing",
      },
      {
        name: "Customizing your theme",
        hash: "#customizing-your-theme",
        keywords: ["customize", "id", "manifest"],
      },
      {
        name: "Development",
        hash: "#development",
      },
      {
        name: "Building, updating, and releasing",
        hash: "#building-updating-and-releasing",
        keywords: ["build", "update", "release"],
      },
      {
        name: "Sharing your theme",
        hash: "#sharing-your-theme",
        keywords: ["share"],
      },
    ],
  },
];

const IGNORED_QUERY_PARTS = [
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "at",
  "by",
  "from",
];

/**
 * Get options matching the query and sort by relevance
 *
 * @param query The query to search for
 * @param options Options to search through
 */
function getSearchResults<T extends Searchable>(query: string, options: T[]): T[] {
  query = query.toLowerCase().trim();
  if (query.length === 0) return options;
  let queryParts = query.split(/[\s.-_#]/).filter((part) => part.length > 0);
  queryParts.push(query);
  queryParts = queryParts.filter((part) => !IGNORED_QUERY_PARTS.includes(part));

  const results: T[] = [];

  for (const option of options) {
    const name = option.name.toLowerCase();
    const keywords = option.keywords?.map((keyword) => keyword.toLowerCase()) ?? [];

    if (
      queryParts.every((queryPart) => name.includes(queryPart)) ||
      keywords.some((keyword) => queryParts.some((queryPart) => keyword.includes(queryPart)))
    ) {
      results.push(option);
    }
  }

  results.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    if (aName === query) return -1;
    if (bName === query) return 1;

    const aNameMatchingQueryParts = queryParts.filter((queryPart) => aName.includes(queryPart));
    const bNameMatchingQueryParts = queryParts.filter((queryPart) => bName.includes(queryPart));

    if (aNameMatchingQueryParts.length > bNameMatchingQueryParts.length) return -1;
    if (bNameMatchingQueryParts.length > aNameMatchingQueryParts.length) return 1;

    if (aName.includes(query) && !bName.includes(query)) return -1;
    if (bName.includes(query) && !aName.includes(query)) return 1;

    const aKeywords = a.keywords?.map((keyword) => keyword.toLowerCase()) ?? [];
    const bKeywords = b.keywords?.map((keyword) => keyword.toLowerCase()) ?? [];
    const aKeywordsMatchingQueryParts = queryParts.filter((queryPart) =>
      aKeywords.some((keyword) => keyword.includes(queryPart)),
    );
    const bKeywordsMatchingQueryParts = queryParts.filter((queryPart) =>
      bKeywords.some((keyword) => keyword.includes(queryPart)),
    );

    if (aKeywordsMatchingQueryParts.length > bKeywordsMatchingQueryParts.length) return -1;
    if (bKeywordsMatchingQueryParts.length > aKeywordsMatchingQueryParts.length) return 1;

    return 0;
  });

  return results;
}

export default class Guide extends Command {
  public constructor() {
    super({
      name: "guide",
      description: "Link to information in the Replugged Guide",
      category: "Replugged",
      args: [
        {
          name: "page",
          description: "The page to link to",
          type: Discord.ApplicationCommandOptionType.String,
          autocomplete: true,
          required: true,
        },
        {
          name: "heading",
          description: "The heading on the page to link to",
          type: Discord.ApplicationCommandOptionType.String,
          autocomplete: true,
          required: false,
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

    const { page, heading, mention } = args;

    const pageObj = PAGES.find((p) => p.path === page);
    if (!pageObj) {
      await command.sendMessage("Invalid page. Please choose from the autocomplete options.", {
        ephemeral: true,
      });
      return;
    }
    if (heading && !pageObj.headings?.some((h) => h.hash === heading)) {
      await command.sendMessage("Invalid heading. Please choose from the autocomplete options.", {
        ephemeral: true,
      });
      return;
    }

    let url = BASE_URL;
    url += page;
    if (heading) url += heading;

    let userMention = mention ? `${Discord.userMention(mention.id)} ` : "";

    await command.sendMessage(`${userMention}${url}`);
  }

  public autocomplete({
    name,
    value,
    interaction,
  }: AutocompleteArgsType<Args>): AutocompleteReturnType {
    if (name === "page") {
      const results = getSearchResults(value, PAGES);
      return results.map((result) => ({
        name: result.name,
        value: result.path,
      }));
    }
    if (name === "heading") {
      const page = interaction.options.getString("page");
      if (!page) return null;
      const pageObj = PAGES.find((p) => p.path === page);
      if (!pageObj) return null;
      const { headings } = pageObj;
      if (!headings) return [];
      const results = getSearchResults(value, headings);
      return results.map((result) => ({
        name: result.name,
        value: result.hash,
      }));
    }
  }
}
