import { Message, EmbedBuilder } from "discord.js";
import { exec } from "child_process";
import { requireAdmin } from "../utils/auth";

export default {
    name: "subfinder",
    description: "Discover subdomains for a given domain - Admin only",
    async execute(message: Message, args: string[]) {
        if (!requireAdmin(message)) {
            return;
        }

        if (args.length === 0) {
            message.reply("❌ Please provide a domain to scan for subdomains.\nUsage: `!subfinder example.com`");
            return;
        }

        const domain = args[0];
        
        const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
        if (!domainRegex.test(domain)) {
            message.reply("❌ Please provide a valid domain name.");
            return;
        }

        if ('sendTyping' in message.channel) {
            message.channel.sendTyping();
        }

        const initialEmbed = new EmbedBuilder()
            .setTitle("🔍 Subdomain Discovery")
            .setDescription(`⏳ Scanning subdomains for **${domain}**...\nThis may take 30-60 seconds`)
            .setColor(0xffa500)
            .setTimestamp();

        if (!('send' in message.channel)) {
            message.reply("❌ This command cannot be used in this type of channel.");
            return;
        }

        const sentMessage = await message.channel.send({ embeds: [initialEmbed] });

        try {
            findSubdomains(domain, sentMessage);
        } catch (error) {
            console.error("Error running subfinder:", error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle("❌ Subdomain Scan Failed")
                .setDescription(`Failed to scan subdomains for **${domain}**`)
                .setColor(0xe74c3c)
                .setTimestamp();

            sentMessage.edit({ embeds: [errorEmbed] });
        }
    }
}

function findSubdomains(domain: string, sentMessage: any) {
    exec(`subfinder -d ${domain} -silent`, { timeout: 60000 }, (error, stdout, stderr) => {
        if (!error && stdout) {
            const subdomains = stdout.trim().split('\n').filter(sub => sub.length > 0);
            displayResults(domain, subdomains, sentMessage, "Subfinder CLI");
            return;
        }
    });
}

function displayResults(domain: string, subdomains: string[], sentMessage: any, method: string) {
    if (subdomains.length === 0) {
        const noResultsEmbed = new EmbedBuilder()
            .setTitle("🔍 Subdomain Discovery Complete")
            .setDescription(`❌ No subdomains found for **${domain}**`)
            .setColor(0xe74c3c)
            .setFooter({ text: `Method: ${method}` })
            .setTimestamp();

        sentMessage.edit({ embeds: [noResultsEmbed] });
        return;
    }

    const uniqueSubdomains = [...new Set(subdomains)].sort();
    const subdomainList = uniqueSubdomains.slice(0, 50).join('\n'); 

    const resultEmbed = new EmbedBuilder()
        .setTitle("🔍 Subdomain Discovery Complete")
        .setColor(0x2ecc71)
        .addFields([
            {
                name: "🎯 Target Domain",
                value: `**${domain}**`,
                inline: true
            },
            {
                name: "📊 Results Found",
                value: `**${uniqueSubdomains.length}** subdomains`,
                inline: true
            },
            {
                name: "🔧 Method Used",
                value: method,
                inline: true
            },
            {
                name: "📋 Discovered Subdomains",
                value: `\`\`\`\n${subdomainList}${uniqueSubdomains.length > 50 ? '\n... and more' : ''}\`\`\``,
                inline: false
            }
        ])
        .setFooter({ text: `Scan completed • Found ${uniqueSubdomains.length} subdomains` })
        .setTimestamp();

    sentMessage.edit({ embeds: [resultEmbed] });
}