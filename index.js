require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates, // لضمان استقبال أحداث الصوت
  ],
});

// تحميل ملفات الحماية
require("./handlers/antiSpam")(client);
require("./handlers/antiLinks")(client);
require("./handlers/antiNuke")(client);
require("./handlers/raidProtection")(client);
require("./handlers/botProtection")(client);
require("./handlers/ownerProtection")(client);
require("./events/autoReactMessages")(client);
require("./events/allMemberMessage")(client);
require("./events/welcome")(client);
require("./events/verify")(client);
require("./events/tickets")(client);
require("./events/channelMessage")(client);
require("./events/sendMessageInChannel")(client);

// تحميل ملف الصوت
require("./voice")(client);

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// تشغيل السيرفر للحفاظ على عمل البوت على Railway
const app = express();
const PORT = process.env.PORT || 2000;
app.get("/", (req, res) => {
  res.send("✅ Bot is running...");
});
app.listen(PORT, () => {
  console.log(`🌍 Server is running on port ${PORT}`);
});
// تسجيل الدخول
client.login(process.env.TOKEN);

module.exports = client;
