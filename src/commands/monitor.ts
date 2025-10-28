import { Message, EmbedBuilder } from "discord.js";
import { exec } from "child_process";
import os from "os";
import { requireAdmin } from "../utils/auth";

interface SystemStats {
    cpu: number;
    memory: { used: number; total: number; percent: number };
    disk: { used: string; total: string; percent: string };
    network: { rx: number; tx: number };
    processes: number;
    uptime: number;
}

export default {
    name: "monitor",
    description: "Real-time system monitoring with live updates",
    async execute(message: Message, args: string[]) {
        if (!requireAdmin(message)) {
            return;
        }

        if (!('send' in message.channel)) return;

        const duration = args[0] ? parseInt(args[0]) : 30; 
        const maxDuration = 300; 
        
        if (duration > maxDuration) {
            message.reply(`❌ Maximum monitoring duration is ${maxDuration} seconds`);
            return;
        }

        const initialEmbed = new EmbedBuilder()
            .setTitle("📊 Real-time System Monitor")
            .setDescription("⏳ Starting monitoring... Please wait")
            .setColor(0xffa500)
            .setTimestamp();

        const sentMessage = await message.channel.send({ embeds: [initialEmbed] });
        
        let updateCount = 0;
        const maxUpdates = duration;
        let previousNetworkStats = { rx: 0, tx: 0 };

        const updateInterval = setInterval(async () => {
            try {
                const stats = await getSystemStats();
                
                const networkSpeed = {
                    rxSpeed: updateCount > 0 ? (stats.network.rx - previousNetworkStats.rx) : 0,
                    txSpeed: updateCount > 0 ? (stats.network.tx - previousNetworkStats.tx) : 0
                };
                previousNetworkStats = stats.network;

                const embed = createMonitorEmbed(stats, networkSpeed, updateCount, maxUpdates);
                await sentMessage.edit({ embeds: [embed] });

                updateCount++;
                
                if (updateCount >= maxUpdates) {
                    clearInterval(updateInterval);
                    
                    const finalEmbed = createMonitorEmbed(stats, networkSpeed, updateCount, maxUpdates, true);
                    await sentMessage.edit({ embeds: [finalEmbed] });
                }
            } catch (error) {
                console.error('Monitor update error:', error);
                clearInterval(updateInterval);
                
                const errorEmbed = new EmbedBuilder()
                    .setTitle("❌ Monitoring Error")
                    .setDescription("Failed to update system stats")
                    .setColor(0xe74c3c)
                    .setTimestamp();
                
                await sentMessage.edit({ embeds: [errorEmbed] });
            }
        }, 1000); 

        setTimeout(() => {
            clearInterval(updateInterval);
        }, (duration + 5) * 1000);
    }
}

async function getSystemStats(): Promise<SystemStats> {
    return new Promise((resolve) => {
        // Get CPU usage (simplified approach)
        const loadAvg = os.loadavg();
        const cpuUsage = Math.min((loadAvg[0] / os.cpus().length) * 100, 100);

        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memPercent = (usedMem / totalMem) * 100;

        exec('df -h / | tail -1 | awk \'{print $3 "," $2 "," $5}\'', (error, diskOutput) => {
            const diskParts = diskOutput.trim().split(',');
            const diskStats = {
                used: diskParts[0] || 'N/A',
                total: diskParts[1] || 'N/A',
                percent: diskParts[2] || 'N/A'
            };

            exec('cat /proc/net/dev | grep -E "(eth|wlan|enp)" | head -1 | awk \'{print $2 "," $10}\'', (netError, netOutput) => {
                const netParts = netOutput.trim().split(',');
                const networkStats = {
                    rx: parseInt(netParts[0]) || 0,
                    tx: parseInt(netParts[1]) || 0
                };

                exec('ps aux | wc -l', (procError, procOutput) => {
                    const processCount = parseInt(procOutput.trim()) || 0;

                    resolve({
                        cpu: cpuUsage,
                        memory: {
                            used: usedMem,
                            total: totalMem,
                            percent: memPercent
                        },
                        disk: diskStats,
                        network: networkStats,
                        processes: processCount,
                        uptime: os.uptime()
                    });
                });
            });
        });
    });
}

function createMonitorEmbed(stats: SystemStats, networkSpeed: any, updateCount: number, maxUpdates: number, isComplete = false): EmbedBuilder {
    const cpuBar = createProgressBar(stats.cpu, 100);
    const memBar = createProgressBar(stats.memory.percent, 100);
    
    const rxSpeedMB = (networkSpeed.rxSpeed / 1024 / 1024).toFixed(2);
    const txSpeedMB = (networkSpeed.txSpeed / 1024 / 1024).toFixed(2);
    
    const uptimeFormatted = formatUptime(stats.uptime);
    const progress = ((updateCount / maxUpdates) * 100).toFixed(1);
    
    let color = 0x2ecc71; 
    if (stats.cpu > 80 || stats.memory.percent > 90) {
        color = 0xe74c3c; 
    } else if (stats.cpu > 60 || stats.memory.percent > 75) {
        color = 0xf39c12; 
    }

    const embed = new EmbedBuilder()
        .setTitle(`📊 Real-time System Monitor ${isComplete ? '(Completed)' : '(Live)'}`)
        .setColor(color)
        .addFields([
            {
                name: "🖥️ CPU Usage",
                value: `${cpuBar} **${stats.cpu.toFixed(1)}%**`,
                inline: false
            },
            {
                name: "💾 Memory Usage", 
                value: `${memBar} **${stats.memory.percent.toFixed(1)}%**\n${(stats.memory.used / 1024 / 1024 / 1024).toFixed(1)}GB / ${(stats.memory.total / 1024 / 1024 / 1024).toFixed(1)}GB`,
                inline: false
            },
            {
                name: "💿 Disk Usage",
                value: `**${stats.disk.used}** / **${stats.disk.total}** (${stats.disk.percent})`,
                inline: true
            },
            {
                name: "🌐 Network Speed",
                value: `📥 **${rxSpeedMB} MB/s**\n📤 **${txSpeedMB} MB/s**`,
                inline: true
            },
            {
                name: "⚡ System Info",
                value: `**Processes:** ${stats.processes}\n**Uptime:** ${uptimeFormatted}`,
                inline: true
            }
        ])
        .setFooter({ 
            text: isComplete 
                ? `Monitoring completed • Total: ${updateCount}s`
                : `Live monitoring • ${progress}% (${updateCount}/${maxUpdates}s)`
        })
        .setTimestamp();

    return embed;
}

function createProgressBar(value: number, max: number, length = 20): string {
    const percentage = Math.min(value / max, 1);
    const filled = Math.round(length * percentage);
    const empty = length - filled;
    
    let bar = '';
    for (let i = 0; i < filled; i++) bar += '█';
    for (let i = 0; i < empty; i++) bar += '░';
    
    return `\`${bar}\``;
}

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}