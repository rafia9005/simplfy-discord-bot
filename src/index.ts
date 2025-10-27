import { config } from 'dotenv';
import { DiscordClient } from './clients/discordClient';
import { log } from './utils/logger';
import { onReady } from './events/ready';
import { onMessageCreate } from './events/messageCreate';

// Load environment variables from .env file
config();

// Initialize the Discord client
const client = new DiscordClient();

// Set up event listeners
client.on('ready', onReady);
client.on('messageCreate', onMessageCreate);

// Log in to Discord with the bot token
client.login(process.env.BOT_TOKEN)
  .then(() => log('Bot logged in successfully!'))
  .catch(err => log(`Error logging in: ${err}`));