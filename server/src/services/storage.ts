import fs from 'fs-extra';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '../../data/db.json');

export async function readDB(): Promise<any> {
  try {
    const exists = await fs.pathExists(DB_PATH);
    if (!exists) {
      await fs.ensureFile(DB_PATH);
      await fs.writeJson(DB_PATH, { activities: [], users: [] }, { spaces: 2 });
    }
    return await fs.readJson(DB_PATH);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('readDB error', err);
    return { activities: [], users: [] };
  }
}

export async function writeDB(data: any): Promise<void> {
  try {
    await fs.outputJson(DB_PATH, data, { spaces: 2 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('writeDB error', err);
    throw err;
  }
}
