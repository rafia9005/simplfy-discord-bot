import { Message } from "discord.js";

export default {
    name: 'menu',
    description: 'Display the list of available commands',
    execute(message: Message, args: string[]) {
        const menuEmbed = `
> 🧠 **TeraRush Assistant Menu**
> Modern AI-powered Discord Bot

\`\`\`md
# 🧩 Core Commands
!ping       → Check if the bot is active
!gemini <prompt> → Generate content using Gemini AI
!clear      → Clear your chat history

# ⚙️ Utility
!help       → Show this menu again
\`\`\`

✨ *Tip:* You can tag the bot directly to ask questions!
💡 Example:  @BotName generate me a startup idea
        `;

        if ('send' in message.channel) {
            message.channel.send(menuEmbed);
        }
    }
}
