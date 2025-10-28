import { Message } from "discord.js";
import { readdirSync } from 'fs';
import { join } from 'path';

export default {
    name: 'menu',
    description: 'Display the list of available commands',
    execute(message: Message, args: string[]) {
        try {
            const commandsPath = join(__dirname, '../commands');
            const commandFiles = readdirSync(commandsPath).filter(file => 
                (file.endsWith('.ts') || file.endsWith('.js')) && file !== 'menu.ts'
            );

            let commandList = '';
            
            for (const file of commandFiles) {
                try {
                    const command = require(join(commandsPath, file));
                    if (command.default && command.default.name && command.default.description) {
                        commandList += `!${command.default.name.padEnd(12)} → ${command.default.description}\n`;
                    }
                } catch (err) {
                    console.error(`Error loading command ${file}:`, err);
                }
            }

            const menuEmbed = `
> 🧠 **TeraRush Assistant Menu**
> Modern AI-powered Discord Bot

\`\`\`md
# 🧩 Available Commands
${commandList}
\`\`\`

✨ *Tip:* You can tag the bot directly to ask questions!
💡 Example: @BotName generate me a startup idea
            `;

            if ('send' in message.channel) {
                message.channel.send(menuEmbed);
            }
        } catch (error) {
            console.error('Error generating menu:', error);
            if ('send' in message.channel) {
                message.channel.send('❌ Error loading command menu.');
            }
        }
    }
}