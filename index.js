require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
});

// تحميل ملفات الحماية
require("./handlers/antiSpam")(client);
require("./handlers/antiLinks")(client);
require("./handlers/antiNuke")(client);
require("./handlers/raidProtection")(client);
require("./handlers/botProtection")(client);
require("./events/autoReactMessages")(client);
require("./events/allMemberMessage")(client);
require("./events/welcome")(client);
require("./events/verify")(client);
require("./events/tickets")(client);

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
