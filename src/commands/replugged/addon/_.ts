import { Command, CommandUse } from "../../../stuct/index.js";

export default class Addon extends Command {
  public constructor() {
    super({
      name: "addon",
      description: "Addon commands",
      category: "Replugged",
    });
  }

  public async run(command: CommandUse<Record<string, never>>): Promise<void> {
    await command.sendHelp();
  }
}
