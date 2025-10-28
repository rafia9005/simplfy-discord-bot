import { Message } from 'discord.js';

export function isAdmin(message: Message): boolean {
    try {
        const adminIds = JSON.parse(process.env.ADMIN_ID || '[]');
        return adminIds.includes(message.author.id);
    } catch (error) {
        console.error('Error parsing ADMIN_ID:', error);
        return false;
    }
}

export function requireAdmin(message: Message): boolean {
    if (!isAdmin(message)) {
        message.reply('❌ Access denied. This command requires administrator privileges.');
        return false;
    }
    return true;
}