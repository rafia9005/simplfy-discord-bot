import { Message } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

const commands = new Map();

const commandsPath = join(__dirname, '../commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(join(commandsPath, file));
    if (command.default && command.default.name) {
        commands.set(command.default.name, command.default);
    }
}

export const onMessageCreate = (message: Message) => {
    if (message.author.bot) return;

    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const command = commands.get(commandName);
    if (!command) return;

    try {
        command.execute(message, args);
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        message.reply('There was an error executing that command.');
    }
};