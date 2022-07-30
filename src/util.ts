import { ComponentInteraction, Constants, Interaction } from 'eris';
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

export declare interface InteractionAwaiter {
  on(event: 'interaction', handler: (interaction: ComponentInteraction) => unknown): this,
  on(event: 'end', handler: () => unknown): this,
  on(event: string, handler: Function): this
}

export class InteractionAwaiter extends EventEmitter {
  private msgId: string;
  private timeout: number = 10000;
  private resetOnInteract: boolean = true;
  private max?: number;

  private collected: number = 0;
  private runningTimeout?: NodeJS.Timeout;

  constructor(msgId: string, {
    timeout,
    resetOnInteract,
    max
  }: {
    timeout?: number | undefined,
    resetOnInteract?: boolean | undefined,
    max?: number | undefined
  } = {}) {
    super();
    this.msgId = msgId;
    if (timeout !== undefined) this.timeout = timeout;
    if (resetOnInteract !== undefined) this.resetOnInteract = resetOnInteract;
    if (max !== undefined) this.max = max;

    this.on('interactionCreate', this.handleInteraction);
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
    this.off('interactionCreate', this.handleInteraction);
    this.emit('end');
    clearTimeout(this.runningTimeout);
  }

  public resetTimeout() {
    clearTimeout(this.runningTimeout);
    this.runningTimeout = setTimeout(this.end, this.timeout);
  }

  public waitForEnd(): Promise<void> {
    return new Promise((resolve) => {
      this.on('end', resolve);
    });
  }
}