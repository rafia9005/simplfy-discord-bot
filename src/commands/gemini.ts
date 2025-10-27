import { Message, AttachmentBuilder } from 'discord.js';
import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { saveChat, getChats } from '../utils/sqlite';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    meta?: {
        type?: 'image' | 'text';
        filename?: string;
    };
}

export default {
    name: 'gemini',
    description: 'Generate content using Gemini AI',
    async execute(message: Message, args: string[]) {
        const prompt = args.join(' ');
        if (!prompt) {
            message.reply('Please provide a prompt! Usage: `!gemini your prompt here`');
            return;
        }

        try {
            saveChat(message.author.id, 'user', prompt);
        } catch (err) {
            console.error('Failed saving user prompt to DB:', err);
        }

        try {
            if ('sendTyping' in message.channel && typeof (message.channel as any).sendTyping === 'function') {
                await (message.channel as any).sendTyping();
            }

            const ai = new GoogleGenAI({
                apiKey: process.env.GEMINI_TOKEN,
            });

            const config = {
                responseModalities: ['TEXT'],
            };

            const model = 'gemini-2.0-flash-exp';
            const history = getChats(message.author.id, 20) as ChatMessage[];
            const contents: any[] = [];

            for (const chat of history) {
                if (!chat || !chat.content) continue;
                if (chat.content.startsWith('[image:')) continue;

                contents.push({
                    role: chat.role === 'user' ? 'user' : 'model',
                    parts: [{ text: chat.content }],
                });
            }

            contents.push({
                role: 'user' as const,
                parts: [{ text: prompt }],
            });

            const response = await ai.models.generateContentStream({
                model,
                config,
                contents,
            });

            let textResponse = '';
            const attachments: AttachmentBuilder[] = [];
            let fileIndex = 0;

            for await (const chunk of response) {
                const content = chunk?.candidates?.[0]?.content;
                if (!content?.parts) continue;
                const part = content.parts[0];

                if (part.inlineData) {
                    const inlineData = part.inlineData;
                    const fileExtension = mime.getExtension(inlineData.mimeType || '') || 'bin';
                    const filename = `generated_${fileIndex}.${fileExtension}`;
                    const buffer = Buffer.from(inlineData.data || '', 'base64');
                    const attachment = new AttachmentBuilder(buffer, { name: filename });
                    attachments.push(attachment);

                    try {
                        saveChat(message.author.id, 'assistant', `[image:${filename}]`, {
                            type: 'image',
                            filename,
                        });
                    } catch (err) {
                        console.error('Failed saving assistant image to DB:', err);
                    }

                    fileIndex++;
                } else if (chunk.text) {
                    textResponse += chunk.text;
                }
            }

            if (textResponse) {
                try {
                    saveChat(message.author.id, 'assistant', textResponse);
                } catch (err) {
                    console.error('Failed saving assistant text to DB:', err);
                }
            }

            if (textResponse || attachments.length > 0) {
                const messageOptions: any = {};
                if (textResponse) messageOptions.content = textResponse.slice(0, 2000);
                if (attachments.length > 0) messageOptions.files = attachments;
                // if ('send' in message.channel) await message.channel.send(messageOptions);
                message.reply(messageOptions)
            } else {
                message.reply('No response generated.');
            }
        } catch (error) {
            console.error('Error executing gemini command:', error);
            message.reply('An error occurred while generating content.');
        }
    },
};
