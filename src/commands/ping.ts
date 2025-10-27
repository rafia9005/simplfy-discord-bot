import { Message } from 'discord.js';

export default {
    name: 'ping',
    description: 'Replies with Pong!',
    execute(message: Message, args: string[]) {
        if ('send' in message.channel) {
            message.channel.send('Bot status active!');
        }
    }
};