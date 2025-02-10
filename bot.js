require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const API_KEY = process.env.GEMINI_API_KEY;
const BOT_TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1338620640139411608"; // 🔹 عيّن ID القناة المسموح بها

// 🔹 الردود المحددة مسبقًا
const predefinedResponses = {
  مرحبا: "👋 مرحبًا! كيف يمكنني مساعدتك؟",
  "كيف حالك": "😊 أنا بخير، شكرًا لسؤالك!",
  وداعًا: "👋 إلى اللقاء! أتمنى لك يومًا سعيدًا!",
  cash: "01234"
};

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return; // تجاهل رسائل البوت

  // 🔹 التأكد من أن الرسالة في القناة المحددة
  if (message.channel.id !== CHANNEL_ID) return;

  const userMessage = message.content.trim().toLowerCase();

  // 🔹 التحقق من الردود المحددة مسبقًا
  if (predefinedResponses[userMessage]) {
    return message.reply(predefinedResponses[userMessage]);
  }

  // 🔹 استدعاء Gemini AI إذا لم يكن هناك رد محدد مسبقًا
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`,
      { contents: [{ parts: [{ text: userMessage }] }] }
    );

    const botReply = response.data.candidates[0].content.parts[0].text;
    message.reply(botReply);
  } catch (error) {
    console.error("❌ خطأ في استدعاء الذكاء الاصطناعي:", error);
    message.reply("🚫 آسف، حدث خطأ أثناء معالجة طلبك.");
  }
});

client.login(BOT_TOKEN);
