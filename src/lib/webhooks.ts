import axios from 'axios';

interface DiscordPayload {
    content?: string;
    embeds?: Array<{
        title?: string;
        description?: string;
        color?: number;
        fields?: Array<{ name: string; value: string; inline?: boolean }>;
        timestamp?: string;
    }>;
}

/**
 * Sends a notification to a Discord Webhook
 */
export async function sendDiscordWebhook(url: string, payload: DiscordPayload) {
    if (!url) return;
    try {
        await axios.post(url, payload);
        return { success: true };
    } catch (error) {
        console.error('Discord Webhook Error:', error);
        return { success: false, error };
    }
}

/**
 * Sends a message to a Telegram Bot
 */
export async function sendTelegramMessage(botToken: string, chatId: string, message: string) {
    if (!botToken || !chatId) return;
    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await axios.post(url, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });
        return { success: true };
    } catch (error) {
        console.error('Telegram Error:', error);
        return { success: false, error };
    }
}

/**
 * Predefined event templates
 */
export const WebhookTemplates = {
    ADMIN_LOGIN: (adminEmail: string) => ({
        embeds: [{
            title: '🔐 Admin Girişi',
            description: `Yönetici paneline giriş yapıldı: **${adminEmail}**`,
            color: 0x3b82f6, // Blue
            timestamp: new Date().toISOString()
        }]
    }),
    LARGE_WITHDRAWAL: (username: string, amount: string, currency: string) => ({
        embeds: [{
            title: '⚠️ Büyük Çekim Talebi',
            description: `**${username}** tarafından yüksek tutarlı çekim talebi!`,
            fields: [
                { name: 'Tutar', value: `${amount} ${currency}`, inline: true },
                { name: 'Durum', value: 'Onay Bekliyor', inline: true }
            ],
            color: 0xef4444, // Red
            timestamp: new Date().toISOString()
        }]
    }),
    SYSTEM_ALERT: (title: string, message: string) => ({
        embeds: [{
            title: `🚨 ${title}`,
            description: message,
            color: 0xffa500, // Orange
            timestamp: new Date().toISOString()
        }]
    })
};
