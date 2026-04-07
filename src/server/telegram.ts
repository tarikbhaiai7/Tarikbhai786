import "dotenv/config";

export async function sendToTelegram(data: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!token || !chatId) {
    console.warn("Telegram Bot: Missing token or chat ID. Logging skipped.");
    return;
  }

  console.log(`Telegram Bot: Sending ${data.type || 'CHAT'} log...`);

  let text = "";
  if (data.type === "EMERGENCY") {
    text = `🚨 EMERGENCY ALERT 🚨
------------------------
👤 Name: ${data.name}
🆔 ID: ${data.userId}
📍 Location: ${data.location}
⏰ Time: ${data.timestamp}
------------------------`;
  } else if (data.type === "LOCATION_UPDATE") {
    text = `📍 LIVE LOCATION UPDATE 📍
------------------------
🆔 ID: ${data.userId}
📍 Location: ${data.location}
🔗 Maps: ${data.mapsLink}
⏰ Time: ${data.timestamp}
------------------------`;
  } else {
    text = `------------------------
👤 Name: ${data.name}
🆔 ID: ${data.userId}
💬 Message: ${data.message}
🤖 Reply: ${data.reply}
🌐 IP: ${data.ip}
⏰ Time: ${data.timestamp}
------------------------`;
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch (error) {
    console.error("Telegram Logging Error:", error);
  }
}
