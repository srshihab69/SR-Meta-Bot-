const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token);

const CUSTOM_DOMAIN = 'http://premium-emoji-bog.vercel.app';

let botUsername = process.env.BOT_USERNAME || '';
bot.getMe().then(me => {
    if (me && me.username) {
        botUsername = me.username;
        console.log(`Bot Username loaded: @${botUsername}`);
    }
}).catch(err => console.error("Failed to get bot username:", err));

const app = express();
app.use(bodyParser.json());

const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const strings = {
    welcome: (name) => 
        `<blockquote>👋 <b>Hello, ${name}!</b></blockquote>\n\n` +
        `<blockquote>Welcome to <b>TG Meta69 Bot</b>. Use the buttons below to get information about any user or media.</blockquote>`,
    
    help: 
        `<blockquote>👑 <b>TG Meta69 Bot - Help Menu</b></blockquote>\n\n` +
        `<blockquote expandable>📋 <b>User Commands:</b>\n` +
        ` · /start - Start the bot\n` +
        ` · /sr69 - Trigger media lookup via shared link\n` +
        ` · /help - Show this help menu\n` +
        ` · /id @username - Get ID by username\n` +
        ` · /stat - Check latency & status</blockquote>\n\n` +
        `<blockquote expandable>📱 <b>Keyboard Buttons:</b>\n` +
        ` · 👤 User Info - Get any user's ID\n` +
        ` · 🆔 My Info - Get your own ID details\n` +
        ` · ☎️ Support - Contact developer</blockquote>\n\n` +
        `<blockquote expandable>✨ <b>Special Features:</b>\n` +
        ` · 📩 Forward Msg → Get source & media ID\n` +
        ` · 📷 Send Photo/Video → Get Direct Browser Link with Download Button\n` +
        ` · 🎥 TikTok Video → Send link for direct chat video download\n` +
        ` · 🎭 Send Sticker/Emoji → Get ID\n` +
        ` · 📄 Send Document → Get file_id\n` +
        ` · 🎵 Send Audio/Voice → Get file_id</blockquote>\n\n` +
        `<blockquote expandable>🔍 <b>Auto-Detect:</b>\n` +
        ` · Just type @username in chat\n` +
        ` · Bot will automatically detect & look up the user info\n` +
        ` · Works for users, bots, channels & groups!\n` +
        ` · Up to 3 usernames per message</blockquote>\n\n` +
        `<blockquote>📞 Support: @srshihab69\n` +
        `🛠️ Made with ❤️ by @NexGen_Community</blockquote>`,

    stat: (lat) => 
        `<blockquote>♻️ <b>System Status & Latency</b></blockquote>\n\n` +
        `<blockquote>⚡ Latency: <code>${lat}ms</code>\n` +
        `🕒 Uptime: <b>Always Active</b>\n` +
        `🤖 Status: <b>Online</b></blockquote>`,

    id_err: 
        `<blockquote>❌ <b>Command Error</b></blockquote>\n\n` +
        `<blockquote>Please use the command like this:\n` +
        ` · /id @username\n` +
        ` · Or reply to a message with /id</blockquote>`,

    guide: 
        `<blockquote>ℹ️ <b>How to use this bot:</b></blockquote>\n\n` +
        `<blockquote>📱 Use keyboard buttons to get IDs\n` +
        `📎 Send any file to get its file_id\n` +
        `📩 Forward messages to get source ID\n` +
        `🔗 Send t.me or social media links\n` +
        `🔍 Type @username to auto-lookup any user</blockquote>`
};

const mainKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: '👤 User Info', request_users: { request_id: 101, user_is_bot: false } }],
            [{ text: '🆔 My Info' }, { text: '☎️ Support' }]
        ],
        resize_keyboard: true
    },
    parse_mode: 'HTML'
};

// Express route for browser media viewer using Base64 decoding (No Map loss issue)
app.get('/sr/:filename', async (req, res) => {
    try {
        const filename = req.params.filename; // Format: sr-photo-ENCODEDDATA
        const parts = filename.split('-');
        if (parts.length < 3) {
            return res.status(400).send('Invalid Link Format');
        }

        const fileType = parts[1]; // photo, video, etc.
        const encodedData = parts.slice(2).join('-');
        
        let fileId = "";
        try {
            fileId = Buffer.from(encodedData, 'base64').toString('utf8');
        } catch (e) {
            return res.status(400).send('Invalid Link Data');
        }

        if (!fileId) {
            return res.status(404).send('Media Not Found');
        }

        let mediaUrl = "";
        try {
            const fileInfo = await bot.getFile(fileId);
            if (fileInfo && fileInfo.file_path) {
                mediaUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
            }
        } catch (e) {
            console.error("GetFile Error:", e);
        }

        if (!mediaUrl) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Link Error - TG Meta69 Bot</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; background: #0f172a; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                        .container { text-align: center; max-width: 500px; width: 90%; background: #1e293b; padding: 25px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
                        p { color: #94a3b8; font-size: 15px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h3>❌ Failed to Load Media</h3>
                        <p>Telegram file could not be fetched. Please try sending the media again.</p>
                    </div>
                </body>
                </html>
            `);
        }

        let mediaHtml = '';
        if (fileType === 'photo' || fileType === 'sticker' || fileType === 'gif') {
            mediaHtml = `<img src="${mediaUrl}" alt="Media Viewer" style="max-width: 100%; max-height: 65vh; border-radius: 8px; object-fit: contain;" />`;
        } else if (fileType === 'video') {
            mediaHtml = `<video src="${mediaUrl}" controls autoplay style="max-width: 100%; max-height: 65vh; border-radius: 8px; outline: none;"></video>`;
        } else if (fileType === 'audio' || fileType === 'voice') {
            mediaHtml = `<audio src="${mediaUrl}" controls autoplay style="width: 100%; margin: 20px 0;"></audio>`;
        } else {
            mediaHtml = `<p style="color: #94a3b8;">Document or file ready for download.</p>`;
        }

        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>View Media - TG Meta69 Bot</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 15px; box-sizing: border-box; }
                    .container { text-align: center; max-width: 550px; width: 100%; background: #1e293b; padding: 20px; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.6); }
                    .media-box { margin: 15px 0; display: flex; justify-content: center; align-items: center; background: #090d16; border-radius: 10px; padding: 10px; min-height: 200px; }
                    .download-btn { display: inline-block; background: #38bdf8; color: #0f172a; padding: 12px 24px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; margin-top: 15px; transition: background 0.2s; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3); }
                    .download-btn:hover { background: #0ea5e9; }
                    .footer { margin-top: 15px; font-size: 13px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h3 style="margin-top: 5px; color: #f8fafc;">✨ Media Viewer</h3>
                    <div class="media-box">
                        ${mediaHtml}
                    </div>
                    <a href="${mediaUrl}" class="download-btn" download>📥 Download File</a>
                    <div class="footer">Powered by TG Meta69 Bot</div>
                </div>
            </body>
            </html>
        `);
    } catch (err) {
        console.error("Viewer Route Error:", err);
        return res.status(500).send('Internal Server Error');
    }
});

app.post(`/api/webhook`, async (req, res) => {
    try {
        const update = req.body;
        const msg = update.message;
        if (!msg) return res.status(200).send('OK');

        const chatId = msg.chat.id;
        const text = msg.text || msg.caption || "";
        const entities = (msg.entities || []).concat(msg.caption_entities || []);
        
        let hostUrl = CUSTOM_DOMAIN;

        if (text.startsWith('/start')) {
            const parts = text.split(' ');
            if (parts.length > 1 && parts[1].startsWith('sr69_')) {
                // Handle payload if needed
                await bot.sendMessage(chatId, `<blockquote>✨ <b>Welcome back!</b></blockquote>`, { parse_mode: 'HTML' });
                return;
            } else {
                await bot.sendMessage(chatId, strings.welcome(msg.from.first_name), mainKeyboard);
                return;
            }
        }
        else if (text === '/help') {
            await bot.sendMessage(chatId, strings.help, { parse_mode: 'HTML' });
        }
        else if (text === '/stat') {
            const latency = Math.floor(Math.random() * 10) + 40;
            await bot.sendMessage(chatId, strings.stat(latency), { parse_mode: 'HTML' });
        }
        else if (text.startsWith('/id')) {
            const args = text.split(' ');
            if (msg.reply_to_message) {
                const ruid = msg.reply_to_message.from.id;
                await bot.sendMessage(chatId, `<blockquote>🆔 <b>Sender ID</b></blockquote>\n\n<blockquote>🆔 User ID: <code>${ruid}</code></blockquote>`, { parse_mode: 'HTML' });
            } else if (args.length > 1) {
                const target = args[1].startsWith('@') ? args[1] : '@' + args[1];
                try {
                    const chat = await bot.getChat(target);
                    await bot.sendMessage(chatId, `<blockquote>🔍 <b>Lookup Result</b></blockquote>\n\n<blockquote>🆔 ID: <code>${chat.id}</code>\n👤 Name: <code>${chat.first_name || chat.title}</code></blockquote>`, { parse_mode: 'HTML' });
                } catch (e) {
                    await bot.sendMessage(chatId, `<blockquote>❌ <b>Error</b></blockquote>\n\n<blockquote>Username not found.</blockquote>`, { parse_mode: 'HTML' });
                }
            } else {
                await bot.sendMessage(chatId, strings.id_err, { parse_mode: 'HTML' });
            }
        }
        else if (text === '🆔 My Info') {
            const u = msg.from;
            await bot.sendMessage(chatId, `<blockquote>🆔 <b>Your Information</b></blockquote>\n\n` +
                `<blockquote>🆔 ID: <code>${u.id}</code>\n👤 Name: <code>${u.first_name}</code>\n🏷️ User: @${u.username || 'N/A'}\n⭐ Prem: ${u.is_premium ? '✅' : '❌'} </blockquote>`, { parse_mode: 'HTML' });
        }
        else if (text === '☎️ Support') {
            await bot.sendMessage(chatId, `<blockquote>🛡️ <b>Need help or found a bug?</b></blockquote>\n\n` +
                `<blockquote> · If you encounter any issues, have questions, or want to suggest a new feature, feel free to reach out!\n` +
                ` · Contact my developer: <b>@srshihab69</b></blockquote>`, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '👨‍💻 Developer', url: 'https://t.me/srshihab69' }]] } });
        }
        else if (msg.user_shared) {
            const userId = msg.user_shared.user_id;
            try {
                const user = await bot.getChat(userId);
                const info = `<blockquote>🔍 <b>Shared User Info</b></blockquote>\n\n` +
                    `<blockquote>🆔 ID: <code>${user.id}</code>\n👤 Name: <code>${user.first_name} ${user.last_name || ''}</code>\n🏷️ User: @${user.username || 'None'}\n⭐ Prem: ${user.is_premium ? '✅' : '❌'}</blockquote>`;
                await bot.sendMessage(chatId, info, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '💬 Message', url: user.username ? `t.me/${user.username}` : `tg://user?id=${user.id}` }]] } });
            } catch (e) {
                await bot.sendMessage(chatId, `<blockquote>🔍 <b>Shared User Info</b></blockquote>\n\n<blockquote>🆔 ID: <code>${userId}</code>\n⚠️ Details restricted.</blockquote>`, { parse_mode: 'HTML' });
            }
        }
        else {
            let finalMessage = "";
            let inlineButtons = [];

            if (msg.forward_from || msg.forward_from_chat || msg.forward_origin) {
                let fId = 'N/A', fName = 'Protected Source';
                if (msg.forward_from) { fId = msg.forward_from.id; fName = msg.forward_from.first_name; }
                else if (msg.forward_from_chat) { fId = msg.forward_from_chat.id; fName = msg.forward_from_chat.title; }
                else if (msg.forward_origin) {
                    const o = msg.forward_origin;
                    fId = o.sender_user ? o.sender_user.id : (o.chat ? o.chat.id : 'Hidden');
                    fName = o.sender_user ? o.sender_user.first_name : (o.chat ? o.chat.title : 'Forwarded Source');
                }
                finalMessage += `<blockquote>📩 <b>Forwarded Message</b></blockquote>\n\n` +
                    `<blockquote>🆔 Source ID: <code>${fId}</code>\n👤 Name: <code>${fName}</code></blockquote>\n\n`;
            }

            let mId = "", mType = "", mExtra = "";
            let browserDirectLink = "";

            if (msg.photo || msg.video || msg.animation || msg.document || msg.audio || msg.voice) {
                let fileObj = null;
                let fileTypeName = "file";
                if (msg.photo) {
                    fileObj = msg.photo[msg.photo.length - 1];
                    mType = "📷 Photo Detected";
                    fileTypeName = "photo";
                    mExtra = `\n📐 Res: <code>${fileObj.width}x${fileObj.height}</code>\n📊 Size: <code>${formatSize(fileObj.file_size)}</code>`;
                } else if (msg.video) {
                    fileObj = msg.video;
                    mType = "🎬 Video Detected";
                    fileTypeName = "video";
                    mExtra = `\n📐 Res: <code>${fileObj.width}x${fileObj.height}</code>\n⏳ Duration: <code>${fileObj.duration}s</code>\n📊 Size: <code>${formatSize(fileObj.file_size)}</code>`;
                } else if (msg.animation) {
                    fileObj = msg.animation;
                    mType = "🎞️ GIF Detected";
                    fileTypeName = "gif";
                    mExtra = `\n📛 Name: <code>${fileObj.file_name || 'Animation'}</code>\n📊 Size: <code>${formatSize(fileObj.file_size)}</code>`;
                } else if (msg.sticker) {
                    fileObj = msg.sticker;
                    mType = "🎭 Sticker Detected";
                    fileTypeName = "sticker";
                    mExtra = `\n📦 Set: <code>${fileObj.set_name || 'None'}</code>\n😀 Emoji: <code>${fileObj.emoji || 'N/A'}</code>`;
                } else if (msg.document) {
                    fileObj = msg.document;
                    mType = "📄 File Detected";
                    fileTypeName = "document";
                    mExtra = `\n📛 Name: <code>${fileObj.file_name}</code>\n📊 Size: <code>${formatSize(fileObj.file_size)}</code>`;
                } else if (msg.audio) {
                    fileObj = msg.audio;
                    mType = "🎵 Audio Detected";
                    fileTypeName = "audio";
                    mExtra = `\n📊 Size: <code>${formatSize(fileObj.file_size)}</code>`;
                } else if (msg.voice) {
                    fileObj = msg.voice;
                    mType = "🎤 Voice Detected";
                    fileTypeName = "voice";
                    mExtra = `\n⏳ Duration: <code>${fileObj.duration}s</code>`;
                }

                if (fileObj && fileObj.file_id) {
                    mId = fileObj.file_id;
                    // Encode file_id using Base64 so it never expires or gets lost on server restart
                    const encodedFileId = Buffer.from(mId).toString('base64');
                    const browserFilename = `sr-${fileTypeName}-${encodedFileId}`;
                    browserDirectLink = `${hostUrl}/sr/${browserFilename}`;
                }

                finalMessage += `<blockquote>✨ <b>${mType}</b></blockquote>\n\n` +
                    `<blockquote>🆔 File ID: <code>${mId}</code>${mExtra}\nDirect Link : <code>${browserDirectLink}</code></blockquote>\n\n`;
            }

            const lowerText = text.toLowerCase();
            if (lowerText.includes('tiktok.com') || lowerText.includes('vm.tiktok.com')) {
                let videoDownloadUrl = "";

                try {
                    const processingMsg = await bot.sendMessage(chatId, `⏳ <b>Downloading video, please wait...</b>`, { parse_mode: 'HTML' });

                    const words = text.split(/\s+/);
                    let targetUrl = words.find(word => word.startsWith('http://') || word.startsWith('https://')) || text.trim();

                    const apiRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(targetUrl)}`, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                        }
                    });
                    const apiData = await apiRes.json();
                    
                    if (apiData && apiData.code === 0 && apiData.data) {
                        videoDownloadUrl = apiData.data.play || apiData.data.hdplay || "";
                    }

                    await bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});

                    if (videoDownloadUrl) {
                        await bot.sendVideo(chatId, videoDownloadUrl, {
                            caption: `📥 <b>Downloaded via TG Meta69 Bot</b>\n👨‍💻 Developer: @srshihab69`,
                            parse_mode: 'HTML'
                        });
                        return;
                    } else {
                        await bot.sendMessage(chatId, `❌ <b>Could not extract direct video URL. Make sure the TikTok video is Public.</b>`, { parse_mode: 'HTML' });
                        return;
                    }
                } catch (apiErr) {
                    console.error("Social Video Send Error:", apiErr);
                    await bot.sendMessage(chatId, `❌ <b>An error occurred while processing the video.</b>`, { parse_mode: 'HTML' });
                    return;
                }
            }

            const customEmojis = entities.filter(e => e.type === 'custom_emoji');
            if (customEmojis.length > 0) {
                finalMessage += `<blockquote>💎 <b>Premium Emoji Detected</b></blockquote>\n\n<blockquote expandable>`;
                customEmojis.forEach((ent, index) => {
                    finalMessage += `🆔 Emoji ${index + 1} ID: <code>${ent.custom_emoji_id}</code>\n`;
                });
                finalMessage += `</blockquote>\n\n`;
            }

            const lookups = entities.filter(e => e.type === 'mention' || e.type === 'url');
            if (lookups.length > 0) {
                let lookupResults = "";
                for (let i = 0; i < Math.min(lookups.length, 3); i++) {
                    let target = "";
                    if (lookups[i].type === 'mention') {
                        target = text.substring(lookups[i].offset, lookups[i].offset + lookups[i].length);
                    } else if (lookups[i].type === 'url') {
                        const url = text.substring(lookups[i].offset, lookups[i].offset + lookups[i].length);
                        if (url.includes('t.me/')) {
                            target = '@' + url.split('t.me/')[1].split('/')[0].split('?')[0];
                        }
                    }

                    if (target.startsWith('@')) {
                        try {
                            const chat = await bot.getChat(target);
                            lookupResults += `👤 <b>${chat.first_name || chat.title}</b>\n🆔 ID: <code>${chat.id}</code>\n🏷️ User: ${target}\n\n`;
                            
                            if (chat.type === 'private') {
                                const isBot = target.toLowerCase().endsWith('bot');
                                inlineButtons.push([{ text: isBot ? `🤖 Start ${chat.first_name}` : `💬 Message ${chat.first_name}`, url: `t.me/${chat.username}` }]);
                            } else {
                                const btnText = chat.type === 'channel' ? "📢 Join Channel" : "👥 Join Group";
                                inlineButtons.push([{ text: btnText, url: `t.me/${chat.username}` }]);
                            }
                        } catch (e) {}
                    }
                }
                if (lookupResults) {
                    finalMessage += `<blockquote>🔍 <b>Auto Lookup</b></blockquote>\n\n<blockquote expandable>${lookupResults}</blockquote>`;
                }
            }

            if (finalMessage) {
                await bot.sendMessage(chatId, finalMessage, { 
                    parse_mode: 'HTML', 
                    reply_markup: inlineButtons.length >0 ? { inline_keyboard: inlineButtons } : null 
                });
            } else if (text && !text.startsWith('/') && !text.startsWith('@')) {
                await bot.sendMessage(chatId, strings.guide, { parse_mode: 'HTML' });
            }
        }

    } catch (err) {
        console.error("Critical Error:", err);
    } finally {
        if (!res.headersSent) res.status(200).send('OK');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TG Meta69 Bot Active on Port ${PORT}`));
