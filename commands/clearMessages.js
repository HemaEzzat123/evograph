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
      // Check if user has the "Manage Messages" permission
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply("🚫 ليس لديك صلاحية لحذف الرسائل.");
      }

      // Get the number of messages to delete
      const amount = parseInt(args[0]) || 100;

      if (isNaN(amount) || amount < 1 || amount > 100) {
        return message.reply("⚠️ يرجى تحديد عدد بين 1 و 100.");
      }

      try {
        await message.channel.bulkDelete(amount, true);
        message.channel.send(`✅ تم مسح ${amount} رسالة بنجاح!`).then((msg) => {
          setTimeout(() => msg.delete(), 3000); // Auto-delete confirmation after 3 seconds
        });
      } catch (error) {
        console.error("❌ خطأ أثناء مسح الرسائل:", error);
        message.reply("🚫 حدث خطأ أثناء محاولة مسح الرسائل.");
      }
    }
  });
};
