import { Message, EmbedBuilder } from "discord.js";
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

            const categories: { [key: string]: string[] } = {
                '🤖 AI & Utilities': ['gemini', 'ping'],
                '📊 System Monitoring': ['status', 'monitor', 'speedtest'],
                '🐳 Container Management': ['container'],
                '💻 System Administration': ['cli'],
                '🛠️ Other Tools': []
            };

            const commands: any[] = [];
            
            for (const file of commandFiles) {
                try {
                    const command = require(join(commandsPath, file));
                    if (command.default && command.default.name && command.default.description) {
                        commands.push({
                            name: command.default.name,
                            description: command.default.description
                        });
                    }
                } catch (err) {
                    console.error(`Error loading command ${file}:`, err);
                }
            }

            commands.sort((a, b) => a.name.localeCompare(b.name));

            const organizedCommands: { [key: string]: any[] } = {};
            
            for (const [category, categoryCommands] of Object.entries(categories)) {
                organizedCommands[category] = commands.filter(cmd => 
                    categoryCommands.includes(cmd.name)
                );
            }

            const usedCommands = Object.values(categories).flat();
            organizedCommands['🛠️ Other Tools'] = commands.filter(cmd => 
                !usedCommands.includes(cmd.name)
            );

            const embed = new EmbedBuilder()
                .setTitle('🧠 TeraRush Assistant Menu')
                .setDescription('Modern AI-powered Discord Bot with System Management')
                .setColor(0x3498db)
                .setThumbnail("https://github.com/terarush/.github/blob/main/profile/179362694.png")
                .setTimestamp();

            for (const [category, categoryCommands] of Object.entries(organizedCommands)) {
                if (categoryCommands.length > 0) {
                    let commandList = '';
                    for (const cmd of categoryCommands) {
                        commandList += `\`!${cmd.name.padEnd(12)}\` → ${cmd.description}\n`;
                    }
                    
                    embed.addFields({
                        name: category,
                        value: commandList || 'No commands',
                        inline: false
                    });
                }
            }

            embed.addFields({
                name: '💡 Usage Tips',
                value: '• Use `!<command>` to execute commands\n• Tag the bot directly to ask AI questions\n• Some commands require admin permissions 🔒',
                inline: false
            });

            embed.setFooter({ 
                text: `${commands.length} commands available • TeraRush Bot v1.0`,
                iconURL: "https://github.com/terarush/.github/blob/main/profile/179362694.png"
            });

            if ('send' in message.channel) {
                message.channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error generating menu:', error);
            if ('send' in message.channel) {
                message.channel.send('❌ Error loading command menu.');
            }
        }
    }
}