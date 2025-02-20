require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const express = require("express");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const API_KEY = process.env.GEMINI_API_KEY;
const CHANNEL_ID = "1340794366570266664";

const predefinedResponses = {};

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== CHANNEL_ID) return;

  const userMessage = message.content.trim().toLowerCase();

  if (predefinedResponses[userMessage]) {
    return message.reply(predefinedResponses[userMessage]);
  }

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

require("./handlers/antiSpam")(client);
require("./handlers/antiLinks")(client);
require("./handlers/antiNuke")(client);
require("./handlers/raidProtection")(client);
require("./handlers/botProtection")(client);
require("./handlers/ownerProtection")(client);
require("./handlers/restoreRoles")(client);
require("./handlers/restoreChannels")(client);
require("./events/autoReactMessages")(client);
require("./events/allMemberMessage")(client);
require("./events/welcome")(client);
require("./events/verify")(client);
require("./events/tickets")(client);
require("./events/channelMessage")(client);
require("./events/sendMessageInChannel")(client);
require("./events/supportTickets")(client);
require("./events/help")(client);
require("./events/updateChannelName")(client);
require("./commands/clearMessages")(client);
require("./voice")(client);
require("./add");

const app = express();
const PORT = process.env.PORT || 2000;
app.get("/", (req, res) => {
  res.send("✅ Bot is running...");
});
app.listen(PORT, () => {
  console.log(`🌍 Server is running on port ${PORT}`);
});

client.login(process.env.TOKEN);

module.exports = client;
