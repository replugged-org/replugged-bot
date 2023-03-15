import { readdirSync } from "fs";
import { CustomClient } from "../types/index.js";

export default (client: CustomClient): void => {
  const events = readdirSync(`${__dirname}/../events`).filter(
    (d) => d.endsWith(".js") || d.endsWith(".ts"),
  );
  for (let file of events) {
    const { default: evt } = require(`../events/${file}`);
    const eName = file.split(".")[0];
    client.on(eName, evt.bind(null, client));
    client.events?.set(eName, evt.bind(null, client));
  }
};
