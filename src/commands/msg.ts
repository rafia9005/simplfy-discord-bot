import { Message, EmbedBuilder } from "discord.js";
import { requireAdmin } from "../utils/auth";

export default {
    name: "msg",
    description: "Send a message to a specified channel or user - Admin only",
    async execute(message: Message, args: string[]) {
        if (!requireAdmin(message)) {
            return;
        }

        if (args.length < 2) {
            message.reply('❌ Usage: `!msg <user_id> <message>`\nExample: `!msg 742948840684126289 Hello there!`');
            return;
        }

        const targetId = args[0];
        const messageContent = args.slice(1).join(' ');

        if (!messageContent.trim()) {
            message.reply('❌ Please provide a message to send.');
            return;
        }

        try {
            const targetUser = await message.client.users.fetch(targetId);

            if (!targetUser) {
                message.reply('❌ User not found. Please check the user ID.');
                return;
            }

            await targetUser.send(messageContent);

            const confirmEmbed = new EmbedBuilder()
                .setTitle("✅ Message Sent Successfully")
                .setColor(0x2ecc71)
                .addFields([
                    {
                        name: "📤 Sent to",
                        value: `${targetUser.tag} (${targetUser.id})`,
                        inline: false
                    },
                    {
                        name: "💬 Message",
                        value: `\`\`\`${messageContent}\`\`\``,
                        inline: false
                    }
                ])
                .setFooter({ text: `Sent by ${message.author.tag}` })
                .setTimestamp();

            if ('send' in message.channel) {
                message.channel.send({ embeds: [confirmEmbed] });
            }

        } catch (error: any) {
            console.error('Error sending message:', error);

            let errorMessage = '❌ Failed to send message.';

            if (error.code === 50007) {
                errorMessage = '❌ Cannot send message to this user. They may have DMs disabled or blocked the bot.';
            } else if (error.code === 10013) {
                errorMessage = '❌ User not found. Please check the user ID.';
            }

            const errorEmbed = new EmbedBuilder()
                .setTitle("❌ Message Failed")
                .setDescription(errorMessage)
                .setColor(0xe74c3c)
                .addFields([
                    {
                        name: "🎯 Target ID",
                        value: targetId,
                        inline: true
                    },
                    {
                        name: "💬 Message",
                        value: `\`\`\`${messageContent}\`\`\``,
                        inline: false
                    }
                ])
                .setTimestamp();

            if ('send' in message.channel) {
                message.channel.send({ embeds: [errorEmbed] });
            }
        }
    }
}