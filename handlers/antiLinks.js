module.exports = (client) => {
  const bannedLinks = [
    "bit.ly",
    "discord.gg",
    "free-nitro.com",
    "malicious-site.com",
    "pornhub.com",
    "free-nitro",
    "fuck you",
    "shit",
    "fuck",
    "bitch",
    "cunt",
    "asshole",
    "nigger",
    "nigga",
    "niga",
    "nig",
    "a7a",
    "احا",
    "اح",
  ];

  client.on("messageCreate", (message) => {
    if (message.author.bot || !message.guild) return;

    const content = message.content.toLowerCase();
    for (const link of bannedLinks) {
      if (content.includes(link)) {
        message.delete();
        message.reply(
          "🚨 **تم حذف رسالتك لأنها تحتوي على رابط مشبوه او كلام غير اخلاقي!** 🚨"
        );
        break;
      }
    }
  });
};
