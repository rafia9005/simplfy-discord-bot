import { Message, EmbedBuilder } from "discord.js";
import { exec } from "child_process";
import { requireAdmin } from "../utils/auth";

export default {
    name: "cli",
    description: "Execute CLI commands on the server - Admin only",
    execute(message: Message, args: string[]) {
        if (!requireAdmin(message)) {
            return;
        }

        if (args.length === 0) {
            message.reply('❌ Please provide a command to execute. Usage: `!cli <command>`\n\nExample: `!cli neofetch`');
            return;
        }

        const command = args.join(' ');
        
        const blockedCommands = ['rm -rf', 'sudo rm', 'dd if=', 'mkfs', 'fdisk', 'shutdown', 'reboot', 'halt', 'init 0', 'init 6', '> /dev/sda', 'passwd'];
        const isDangerous = blockedCommands.some(blocked => command.toLowerCase().includes(blocked));
        
        if (isDangerous) {
            message.reply('⚠️ Command blocked for security reasons!');
            return;
        }

        if ('sendTyping' in message.channel) {
            message.channel.sendTyping();
        }

        exec(command, { timeout: 10000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            let output = '';
            
            if (stdout) {
                output += stdout;
            }
            
            if (stderr) {
                output += stderr;
            }
            
            if (error) {
                output += `\nError: ${error.message}`;
            }

            if (output.length > 1900) {
                output = output.substring(0, 1900) + '\n... (output truncated)';
            }

            if (!output) {
                output = 'Command executed successfully (no output)';
            }

            const embed = new EmbedBuilder()
                .setTitle(`💻 CLI Output`)
                .setColor(error ? 0xe74c3c : 0x2ecc71)
                .setDescription(`**Command:** \`${command}\`\n\n\`\`\`bash\n${output}\`\`\``)
                .setFooter({ text: `Executed by ${message.author.username} • Command auto-terminated` })
                .setTimestamp();

            if ('send' in message.channel) {
                message.channel.send({ embeds: [embed] });
            }
        });
    }
}