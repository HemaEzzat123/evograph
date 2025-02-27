const { PermissionFlagsBits } = require("discord.js");

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(process.env.PREFIX) || message.author.bot)
      return;

    const args = message.content
      .slice(process.env.PREFIX.length)
      .trim()
      .split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "clear") {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply("🚫 ليس لديك صلاحية لحذف الرسائل.");
      }

      const amount = parseInt(args[0]) || 100;
      if (isNaN(amount) || amount < 1 || amount > 100) {
        return message.reply("⚠️ يرجى تحديد عدد بين 1 الى 100.");
      }

      try {
        const messages = await message.channel.messages.fetch({
          limit: amount,
        });
        if (messages.size === 0) {
          return message.reply("⚠️ لا توجد رسائل قابلة للحذف في هذه القناة.");
        }

        await message.channel.bulkDelete(messages, true);
        message.channel
          .send(`✅ تم مسح ${messages.size} رسالة بنجاح!`)
          .then((msg) => setTimeout(() => msg.delete(), 3000))
          .catch((err) =>
            console.error("❌ خطأ أثناء إرسال رسالة التأكيد:", err)
          );
      } catch (error) {
        console.error("❌ خطأ أثناء مسح الرسائل:", error);
        message.reply("🚫 حدث خطأ أثناء محاولة مسح الرسائل.");
      }
    }
  });
};
