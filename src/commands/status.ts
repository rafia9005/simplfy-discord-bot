import { Message, EmbedBuilder } from "discord.js";
import { execSync } from "child_process";
import { readFileSync, readdirSync } from "fs";
import os from "os";
import { join } from 'path';

export default {
    name: "status",
    description: "Display detailed bot and system status information",
    execute(message: Message, args: string[]) {
        try {
            const platform = os.platform();
            const arch = os.arch();
            const hostname = os.hostname();
            const uptime = process.uptime();
            const systemUptime = os.uptime();
            
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
            const availableMem = freeMem;
            const buffersCached = getBuffersCached();
            
            const cpus = os.cpus();
            const cpuModel = cpus[0].model;
            const cpuCores = cpus.length;
            const cpuSpeed = cpus[0].speed;
            
            let cpuUsage = "N/A";
            let cpuTemp = "N/A";
            let loadAverage = "N/A";
            try {
                if (platform === 'linux') {
                    const loadAvg = os.loadavg();
                    cpuUsage = `${(loadAvg[0] / cpuCores * 100).toFixed(1)}%`;
                    loadAverage = `${loadAvg[0].toFixed(2)}, ${loadAvg[1].toFixed(2)}, ${loadAvg[2].toFixed(2)}`;
                    
                    try {
                        const temp = execSync('cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null', { encoding: 'utf8' }).trim();
                        if (temp) {
                            cpuTemp = `${(parseInt(temp) / 1000).toFixed(1)}°C`;
                        }
                    } catch (e) {}
                }
            } catch (err) {
                console.error('Error getting CPU usage:', err);
            }
            
            let distro = "Unknown";
            let kernel = "Unknown";
            let kernelVersion = "Unknown";
            try {
                if (platform === 'linux') {
                    distro = execSync('lsb_release -d 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME | cut -d "=" -f2 | tr -d \'"\'', { encoding: 'utf8' }).trim();
                    kernel = execSync('uname -r', { encoding: 'utf8' }).trim();
                    kernelVersion = execSync('uname -v', { encoding: 'utf8' }).trim();
                }
            } catch (err) {
                console.error('Error getting distro info:', err);
            }
            
            let diskUsage = "N/A";
            let diskInfo = "N/A";
            let inodeUsage = "N/A";
            try {
                if (platform === 'linux') {
                    diskUsage = execSync('df -h / | tail -1 | awk \'{print $3 "/" $2 " (" $5 ")"}\'', { encoding: 'utf8' }).trim();
                    diskInfo = execSync('df -h | grep -E "^/dev"', { encoding: 'utf8' }).trim();
                    inodeUsage = execSync('df -i / | tail -1 | awk \'{print $5}\'', { encoding: 'utf8' }).trim();
                }
            } catch (err) {
                console.error('Error getting disk usage:', err);
            }
            
            let networkInfo = getNetworkInfo();
            
            let processCount = "N/A";
            try {
                if (platform === 'linux') {
                    processCount = execSync('ps aux | wc -l', { encoding: 'utf8' }).trim();
                }
            } catch (err) {
                console.error('Error getting process count:', err);
            }
            
            const botUptime = formatUptime(uptime);
            const systemUptimeFormatted = formatUptime(systemUptime);
            const nodeVersion = process.version;
            const memUsage = process.memoryUsage();
            const botMemUsage = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
            const botMemTotal = (memUsage.rss / 1024 / 1024).toFixed(2);
            
            const djsVersion = require('discord.js').version;
            
            const guildCount = message.client.guilds.cache.size;
            const userCount = message.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            const channelCount = message.client.channels.cache.size;
            
            const ping = message.client.ws.ping;
            
            const systemEmbed = new EmbedBuilder()
                .setTitle("🖥️ System Information")
                .setColor(0x3498db)
                .addFields(
                    {
                        name: "💻 Operating System",
                        value: `**Distribution:** ${distro}\n**Kernel:** ${kernel}\n**Platform:** ${platform} (${arch})\n**Hostname:** ${hostname}\n**System Uptime:** ${systemUptimeFormatted}`,
                        inline: false
                    },
                    {
                        name: "🔧 Hardware",
                        value: `**CPU:** ${cpuModel}\n**Cores:** ${cpuCores} @ ${cpuSpeed}MHz\n**Temperature:** ${cpuTemp}\n**Load Average:** ${loadAverage}\n**Current Usage:** ${cpuUsage}`,
                        inline: true
                    },
                    {
                        name: "💾 Memory",
                        value: `**Total:** ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB\n**Used:** ${(usedMem / 1024 / 1024 / 1024).toFixed(2)} GB (${memUsagePercent}%)\n**Available:** ${(availableMem / 1024 / 1024 / 1024).toFixed(2)} GB\n**Buffers/Cache:** ${buffersCached}`,
                        inline: true
                    }
                )
                .setTimestamp();

            const storageEmbed = new EmbedBuilder()
                .setTitle("💿 Storage & Network")
                .setColor(0xe74c3c)
                .addFields(
                    {
                        name: "📁 Disk Usage",
                        value: `**Root (/):** ${diskUsage}\n**Inode Usage:** ${inodeUsage}\n**Processes:** ${processCount}`,
                        inline: true
                    },
                    {
                        name: "🌐 Network",
                        value: networkInfo,
                        inline: true
                    }
                )
                .setTimestamp();

            const botEmbed = new EmbedBuilder()
                .setTitle("🤖 Bot Information")
                .setColor(0x2ecc71)
                .addFields(
                    {
                        name: "📊 Bot Stats",
                        value: `**Uptime:** ${botUptime}\n**Latency:** ${ping}ms\n**Memory (Heap):** ${botMemUsage} MB\n**Memory (Total):** ${botMemTotal} MB`,
                        inline: true
                    },
                    {
                        name: "🌐 Discord Stats",
                        value: `**Servers:** ${guildCount}\n**Channels:** ${channelCount}\n**Users:** ${userCount.toLocaleString()}`,
                        inline: true
                    },
                    {
                        name: "🔧 Technical",
                        value: `**Node.js:** ${nodeVersion}\n**Discord.js:** v${djsVersion}\n**Process ID:** ${process.pid}\n**Environment:** ${process.env.NODE_ENV || 'development'}`,
                        inline: false
                    }
                )
                .setFooter({ text: "Bot Status • Last Updated" })
                .setTimestamp();
            
            if ('send' in message.channel) {
                message.channel.send({ embeds: [systemEmbed, storageEmbed, botEmbed] });
            }
        } catch (error) {
            console.error('Error getting status:', error);
            if ('send' in message.channel) {
                message.channel.send('❌ Error retrieving detailed system status.');
            }
        }
    }
}

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

function getBuffersCached(): string {
    try {
        if (os.platform() === 'linux') {
            const meminfo = readFileSync('/proc/meminfo', 'utf8');
            const buffers = meminfo.match(/Buffers:\s+(\d+)/);
            const cached = meminfo.match(/Cached:\s+(\d+)/);
            
            if (buffers && cached) {
                const buffersGB = (parseInt(buffers[1]) / 1024 / 1024).toFixed(2);
                const cachedGB = (parseInt(cached[1]) / 1024 / 1024).toFixed(2);
                return `${buffersGB}GB / ${cachedGB}GB`;
            }
        }
        return "N/A";
    } catch (err) {
        return "N/A";
    }
}

function getNetworkInfo(): string {
    try {
        const networkInterfaces = os.networkInterfaces();
        let info = "";
        
        for (const [name, interfaces] of Object.entries(networkInterfaces)) {
            if (interfaces && name !== 'lo') {
                for (const iface of interfaces) {
                    if (iface.family === 'IPv4' && !iface.internal) {
                        info += `**${name}:** ${iface.address}\n`;
                        break;
                    }
                }
            }
        }
        
        return info || "No external interfaces";
    } catch (err) {
        return "Error getting network info";
    }
}