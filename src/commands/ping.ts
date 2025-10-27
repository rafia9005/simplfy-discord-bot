import { Message } from 'discord.js';

export default {
    name: 'ping',
    description: 'Replies with Pong!',
    execute(message: Message, args: string[]) {
        message.reply('Pong!');
    }
};