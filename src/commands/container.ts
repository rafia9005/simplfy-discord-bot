import { Message, EmbedBuilder } from "discord.js";
import { execSync } from "child_process";
import { requireAdmin } from "../utils/auth";

export default {
    name: "container",
    description: "Manage Docker containers (start, stop, restart, status)",
    execute(message: Message, args: string[]) {
        if (!requireAdmin(message)) {
            return;
        }
        if (args.length === 0) {
            showHelp(message);
            return;
        }

        const action = args[0].toLowerCase();
        const containerName = args[1];

        try {
            switch (action) {
                case 'list':
                case 'ls':
                    listContainers(message);
                    break;
                
                case 'start':
                    if (!containerName) {
                        message.reply('❌ Please specify a container name. Usage: `!container start <container_name>`');
                        return;
                    }
                    startContainer(message, containerName);
                    break;
                
                case 'stop':
                    if (!containerName) {
                        message.reply('❌ Please specify a container name. Usage: `!container stop <container_name>`');
                        return;
                    }
                    stopContainer(message, containerName);
                    break;
                
                case 'restart':
                    if (!containerName) {
                        message.reply('❌ Please specify a container name. Usage: `!container restart <container_name>`');
                        return;
                    }
                    restartContainer(message, containerName);
                    break;
                
                case 'status':
                    if (!containerName) {
                        message.reply('❌ Please specify a container name. Usage: `!container status <container_name>`');
                        return;
                    }
                    containerStatus(message, containerName);
                    break;
                
                case 'logs':
                    if (!containerName) {
                        message.reply('❌ Please specify a container name. Usage: `!container logs <container_name>`');
                        return;
                    }
                    containerLogs(message, containerName);
                    break;
                
                case 'stats':
                    containerStats(message);
                    break;
                
                default:
                    showHelp(message);
            }
        } catch (error) {
            console.error('Container command error:', error);
            message.reply('❌ Error executing container command. Make sure Docker is installed and running.');
        }
    }
}

function showHelp(message: Message) {
    const helpEmbed = new EmbedBuilder()
        .setTitle("🐳 Container Management")
        .setColor(0x2496ed)
        .setDescription("Manage Docker containers with the following commands:")
        .addFields(
            {
                name: "📋 List Commands",
                value: "`!container list` - Show all containers\n`!container stats` - Show container statistics",
                inline: false
            },
            {
                name: "⚡ Control Commands",
                value: "`!container start <name>` - Start a container\n`!container stop <name>` - Stop a container\n`!container restart <name>` - Restart a container",
                inline: false
            },
            {
                name: "📊 Info Commands",
                value: "`!container status <name>` - Check container status\n`!container logs <name>` - Show recent logs",
                inline: false
            }
        )
        .setFooter({ text: "Docker Management • TeraRush Bot" })
        .setTimestamp();

    if ('send' in message.channel) {
        message.channel.send({ embeds: [helpEmbed] });
    }
}

function listContainers(message: Message) {
    try {
        const containers = execSync('docker ps -a --format "table {{.Names}}\\t{{.Status}}\\t{{.Image}}"', { encoding: 'utf8' });
        
        const embed = new EmbedBuilder()
            .setTitle("📋 Container List")
            .setColor(0x00ff00)
            .setDescription(`\`\`\`\n${containers}\`\`\``)
            .setTimestamp();

        if ('send' in message.channel) {
            message.channel.send({ embeds: [embed] });
        }
    } catch (error) {
        message.reply('❌ Error listing containers. Make sure Docker is running.');
    }
}

function startContainer(message: Message, containerName: string) {
    try {
        execSync(`docker start ${containerName}`, { encoding: 'utf8' });
        message.reply(`✅ Container \`${containerName}\` started successfully!`);
    } catch (error) {
        message.reply(`❌ Failed to start container \`${containerName}\`. Check if it exists.`);
    }
}

function stopContainer(message: Message, containerName: string) {
    try {
        execSync(`docker stop ${containerName}`, { encoding: 'utf8' });
        message.reply(`🛑 Container \`${containerName}\` stopped successfully!`);
    } catch (error) {
        message.reply(`❌ Failed to stop container \`${containerName}\`. Check if it exists or is running.`);
    }
}

function restartContainer(message: Message, containerName: string) {
    try {
        execSync(`docker restart ${containerName}`, { encoding: 'utf8' });
        message.reply(`🔄 Container \`${containerName}\` restarted successfully!`);
    } catch (error) {
        message.reply(`❌ Failed to restart container \`${containerName}\`. Check if it exists.`);
    }
}

function containerStatus(message: Message, containerName: string) {
    try {
        const status = execSync(`docker inspect ${containerName} --format="{{.State.Status}}" 2>/dev/null || echo "not found"`, { encoding: 'utf8' }).trim();
        const uptime = execSync(`docker inspect ${containerName} --format="{{.State.StartedAt}}" 2>/dev/null || echo "N/A"`, { encoding: 'utf8' }).trim();
        
        let statusEmoji = "❓";
        let statusColor = 0x95a5a6;
        
        switch (status) {
            case 'running':
                statusEmoji = "🟢";
                statusColor = 0x2ecc71;
                break;
            case 'exited':
                statusEmoji = "🔴";
                statusColor = 0xe74c3c;
                break;
            case 'paused':
                statusEmoji = "⏸️";
                statusColor = 0xf39c12;
                break;
            case 'not found':
                statusEmoji = "❌";
                statusColor = 0xe74c3c;
                break;
        }

        const embed = new EmbedBuilder()
            .setTitle(`${statusEmoji} Container Status: ${containerName}`)
            .setColor(statusColor)
            .addFields(
                { name: "Status", value: status, inline: true },
                { name: "Started At", value: uptime !== "N/A" ? new Date(uptime).toLocaleString() : "N/A", inline: true }
            )
            .setTimestamp();

        if ('send' in message.channel) {
            message.channel.send({ embeds: [embed] });
        }
    } catch (error) {
        message.reply(`❌ Failed to get status for container \`${containerName}\`.`);
    }
}

function containerLogs(message: Message, containerName: string) {
    try {
        const logs = execSync(`docker logs --tail 20 ${containerName}`, { encoding: 'utf8' });
        
        const truncatedLogs = logs.length > 1900 ? logs.substring(0, 1900) + "..." : logs;
        
        const embed = new EmbedBuilder()
            .setTitle(`📄 Logs: ${containerName}`)
            .setColor(0x3498db)
            .setDescription(`\`\`\`\n${truncatedLogs}\`\`\``)
            .setFooter({ text: "Last 20 lines" })
            .setTimestamp();

        if ('send' in message.channel) {
            message.channel.send({ embeds: [embed] });
        }
    } catch (error) {
        message.reply(`❌ Failed to get logs for container \`${containerName}\`.`);
    }
}

function containerStats(message: Message) {
    try {
        const stats = execSync('docker stats --no-stream --format "table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}"', { encoding: 'utf8' });
        
        const embed = new EmbedBuilder()
            .setTitle("📊 Container Statistics")
            .setColor(0x9b59b6)
            .setDescription(`\`\`\`\n${stats}\`\`\``)
            .setTimestamp();

        if ('send' in message.channel) {
            message.channel.send({ embeds: [embed] });
        }
    } catch (error) {
        message.reply('❌ Error getting container statistics.');
    }
}