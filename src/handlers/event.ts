import { readdirSync } from "fs";
import { CustomClient } from "../types/index.js";

const dirname = new URL(".", import.meta.url).pathname;

export default async (client: CustomClient): Promise<void> => {
  const events = readdirSync(`${dirname}../events`).filter(
    (d) => d.endsWith(".js") || d.endsWith(".ts"),
  );
  for (let file of events) {
    const { default: evt } = await import(`../events/${file}?t=${Date.now()}`);
    const eName = file.split(".")[0];
    client.on(eName, evt.bind(null, client));
    client.events?.set(eName, evt.bind(null, client));
  }
};
