import { Client, GatewayIntentBits } from 'discord.js';
import { log } from '../utils/logger';

export class DiscordClient extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
        });

        this.on('ready', this.onReady);
        this.on('messageCreate', this.onMessageCreate);
    }

    private onReady() {
        log(`Logged in as ${this.user?.tag}!`);
    }

    private onMessageCreate(message: any) {
        // Handle message creation logic here
    }
}