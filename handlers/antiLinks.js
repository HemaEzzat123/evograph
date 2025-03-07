module.exports = (client) => {
  const bannedLinks = [
    "steamcommunity.com/gift",
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
