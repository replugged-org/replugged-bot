import { Client, ComponentInteraction, Constants, Interaction, Message } from 'eris';
import EventEmitter from 'events';
import { readdir, stat } from 'fs/promises';
import { URL } from 'url';

export async function readdirRecursive (path: URL): Promise<string[]> {
  const entries = await readdir(path);
  const pending: Array<Promise<string[]>> = [];
  const files: string[] = [];

  for(const entry of entries) {
    const entryUrl = new URL(`./${entry}`, path);
    const res = await stat(entryUrl);
    if(res.isDirectory()) {
      entryUrl.pathname += '/';
      pending.push(readdirRecursive(entryUrl));
    }
    else {
      files.push(entryUrl.pathname);
    }
  }

  return Promise.all(pending).then((found) => files.concat(...found));
}

export function isComponentInteraction(interaction: Interaction): interaction is ComponentInteraction {
  return interaction.type === Constants.InteractionTypes.MESSAGE_COMPONENT;
}

export declare interface InteractionCollector {
  on(event: 'interaction', handler: (interaction: ComponentInteraction) => unknown): this,
  on(event: 'end', handler: () => unknown): this,
  on(event: string, handler: Function): this
}

export class InteractionCollector extends EventEmitter {
  private client: Client;
  private msgId: string;
  private timeout: number = 10000;
  private resetOnInteract: boolean = true;
  private max?: number;

  private collected: number = 0;
  private runningTimeout?: NodeJS.Timeout;

  constructor(message: Message, {
    timeout,
    resetOnInteract,
    max
  }: {
    timeout?: number | undefined,
    resetOnInteract?: boolean | undefined,
    max?: number | undefined
  } = {}) {
    super();
    
    this.msgId = message.id;
    this.client = message._client;

    if (timeout !== undefined) this.timeout = timeout;
    if (resetOnInteract !== undefined) this.resetOnInteract = resetOnInteract;
    if (max !== undefined) this.max = max;

    this.client.on('interactionCreate', (interaction) => this.handleInteraction(interaction));
    this.resetTimeout();
  }

  private handleInteraction(interaction: Interaction) {
    if (!isComponentInteraction(interaction)) return;
    if (interaction.message.id !== this.msgId) return;

    this.emit('interaction', interaction);
    if (this.resetOnInteract) this.resetTimeout();

    this.collected++;
    if (this.max && this.collected >= this.max) this.end();
  }

  public end() {
    this.client.off('interactionCreate', (interaction) => this.handleInteraction(interaction));
    this.emit('end');
    if (this.runningTimeout) clearTimeout(this.runningTimeout);
  }

  public resetTimeout() {
    if (this.runningTimeout) clearTimeout(this.runningTimeout);
    this.runningTimeout = setTimeout(() => this.end(), this.timeout);
  }

  public waitForEnd(): Promise<void> {
    return new Promise((resolve) => {
      this.on('end', resolve);
    });
  }
}
