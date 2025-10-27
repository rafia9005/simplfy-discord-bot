import { Message } from 'discord.js';
import { clearChats } from '../utils/sqlite';

export default {
    name: 'clear',
    description: 'Clear your chat history with Gemini',
    async execute(message: Message, args: string[]) {
        try {
            clearChats(message.author.id);
            message.reply('✅ Your chat history has been cleared!');
        } catch (error) {
            console.error('Error clearing chat:', error);
            message.reply('❌ Failed to clear chat history.');
        }
    }
};