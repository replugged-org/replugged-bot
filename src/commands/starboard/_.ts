import { Command, CommandUse } from "../../stuct/index.js";

export default class Starboard extends Command {
  public constructor() {
    super({
      name: "starboard",
      description: "Starboard commands",
      category: "Starboard",
    });
  }

  public async run(command: CommandUse<Record<string, never>>): Promise<void> {
    await command.sendHelp();
  }
}
