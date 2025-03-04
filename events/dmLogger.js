require("dotenv").config();
const { GatewayIntentBits, Events } = require("discord.js");

module.exports = (client) => {
  const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    if (
      message.content.startsWith("!dm") &&
      message.member.permissions.has("Administrator")
    ) {
      const args = message.content.split(" ").slice(1);
      const mention = message.mentions.users.first();
      const dmMessage = args.slice(1).join(" ");

      if (!mention || !dmMessage) {
        return message.reply("Usage: !dm @user <message>");
      }

      try {
        await mention.send(dmMessage);
        message.reply(`Message sent to ${mention.tag}`);
      } catch (error) {
        console.error("Error sending DM:", error);
        message.reply("Failed to send the message.");
      }
    }

    if (message.channel.type === 1) {
      const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);

      if (logChannel) {
        logChannel.send(
          `**Message from ${message.author.tag}:** ${message.content}`
        );
      } else {
        console.error("Log channel not found.");
      }
    }
  });
};
