import { Message, EmbedBuilder } from "discord.js";

export default {
    name: "speedtest",
    description: "Perform a network speed test using Node.js library",
    async execute(message: Message, args: string[]) {
        if ('sendTyping' in message.channel) {
            message.channel.sendTyping();
        }

        const initialEmbed = new EmbedBuilder()
            .setTitle("🌐 Network Speed Test")
            .setDescription("⏳ Running speed test... This may take 30-60 seconds")
            .setColor(0xffa500)
            .setTimestamp();

        if (!('send' in message.channel)) {
            return;
        }

        const sentMessage = await message.channel.send({ embeds: [initialEmbed] });

        try {
            // Dynamic import for speedtest-net
            const speedTest = await import('speedtest-net');
            
            // Run speed test with configuration and await the result
            const data = await speedTest.default({
                acceptLicense: true,
                acceptGdpr: true
            });

            const downloadMbps = (data.download.bandwidth * 8 / 1000000).toFixed(2);
            const uploadMbps = (data.upload.bandwidth * 8 / 1000000).toFixed(2);
            const ping = data.ping.latency.toFixed(2);
            const jitter = data.ping.jitter ? data.ping.jitter.toFixed(2) : 'N/A';
            
            const downloadSpeed = parseFloat(downloadMbps);
            let speedEmoji = "🐌";
            let speedRating = "Slow";
            let speedColor = 0xe74c3c;
            
            if (downloadSpeed >= 100) {
                speedEmoji = "🚀";
                speedRating = "Excellent";
                speedColor = 0x2ecc71;
            } else if (downloadSpeed >= 50) {
                speedEmoji = "⚡";
                speedRating = "Very Good";
                speedColor = 0x27ae60;
            } else if (downloadSpeed >= 25) {
                speedEmoji = "🏃";
                speedRating = "Good";
                speedColor = 0xf39c12;
            } else if (downloadSpeed >= 10) {
                speedEmoji = "🚶";
                speedRating = "Fair";
                speedColor = 0xff9800;
            }

            const resultEmbed = new EmbedBuilder()
                .setTitle(`${speedEmoji} Network Speed Test Results`)
                .setColor(speedColor)
                .addFields([
                    {
                        name: "📥 Download Speed",
                        value: `**${downloadMbps} Mbps**`,
                        inline: true
                    },
                    {
                        name: "📤 Upload Speed", 
                        value: `**${uploadMbps} Mbps**`,
                        inline: true
                    },
                    {
                        name: "🏓 Ping",
                        value: `**${ping} ms**`,
                        inline: true
                    },
                    {
                        name: "📊 Rating",
                        value: `**${speedRating}**`,
                        inline: true
                    },
                    {
                        name: "📈 Jitter",
                        value: `**${jitter} ms**`,
                        inline: true
                    },
                    {
                        name: "🌐 Server",
                        value: `${data.server.name}\n${data.server.location} (${data.server.country})`,
                        inline: true
                    },
                    {
                        name: "📍 ISP",
                        value: `${data.isp}`,
                        inline: false
                    },
                    {
                        name: "🔗 Result URL",
                        value: `[View Details](${data.result.url})`,
                        inline: false
                    }
                ])
                .setFooter({ 
                    text: `Test completed • Powered by Speedtest.net`,
                    iconURL: "https://www.speedtest.net/favicon.ico"
                })
                .setTimestamp();

            sentMessage.edit({ embeds: [resultEmbed] });

        } catch (importError) {
            console.error('Import error:', importError);
            const installEmbed = new EmbedBuilder()
                .setTitle("❌ Missing Dependency")
                .setDescription("Please install the speedtest-net package:\n```bash\nnpm install speedtest-net\n```")
                .setColor(0xe74c3c)
                .setTimestamp();

            sentMessage.edit({ embeds: [installEmbed] });
        }
    }
}        
