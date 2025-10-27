import { config } from 'dotenv';

config();

export const BOT_TOKEN = process.env.BOT_TOKEN || '';
export const PREFIX = process.env.PREFIX || '!';