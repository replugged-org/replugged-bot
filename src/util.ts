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