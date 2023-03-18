import { readdirSync } from "fs";
import { CustomClient } from "../types/index.js";

import { fileURLToPath } from "url";
import path from "path";

const dirname = path.dirname(fileURLToPath(import.meta.url));
export default async (client: CustomClient): Promise<void> => {
  const events = readdirSync(path.join(dirname, "../events")).filter(
    (d) => d.endsWith(".js") || d.endsWith(".ts"),
  );
  for (let file of events) {
    const { default: evt } = await import(`../events/${file}?t=${Date.now()}`);
    const eName = file.split(".")[0];
    client.on(eName, evt.bind(null, client));
    client.events?.set(eName, evt.bind(null, client));
  }
};
