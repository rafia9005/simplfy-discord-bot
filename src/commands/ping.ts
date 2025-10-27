import { Message } from "discord.js";

export const name = 'ping';
export const description = 'Replies with Pong!';

export const execute = (message: Message) => {
    if (message.content === '!ping') {
        message.reply("Pong!");
    }
};