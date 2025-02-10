const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(process.env.PREFIX) || message.author.bot)
      return;

    const args = message.content
      .slice(process.env.PREFIX.length)
      .trim()
      .split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "createchannel") {
      try {
        const guild = message.guild;

        // إنشاء قناة خاصة
        const channel = await guild.channels.create({
          name: "📢・announcements",
          type: 0, // قناة نصية
          permissionOverwrites: [
            {
              id: guild.id, // الجميع
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: client.user.id, // البوت
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
              ],
            },
          ],
        });

        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("✅ قناة جديدة")
          .setDescription(`تم إنشاء قناة خاصة بنجاح: ${channel}`)
          .setTimestamp();

        message.reply({ embeds: [embed] });
      } catch (error) {
        console.error("❌ خطأ في إنشاء القناة:", error);
        message.reply("⚠️ حدث خطأ أثناء إنشاء القناة. تأكد من الصلاحيات.");
      }
    }

    if (command === "announce") {
      if (!args.length) {
        return message.reply("⚠️ الرجاء تقديم رسالة للإعلان.");
      }

      const announcement = args.join(" ");
      const guild = message.guild;

      const embedAnnounce = new EmbedBuilder()
        .setColor("#ffcc00")
        .setTitle("📢 Announcement ")
        .setDescription(announcement)
        .setFooter({
          text: `إعلان من: ${message.guild.name}`,
          iconURL: message.guild.iconURL(),
        })
        .setTimestamp();

      message.reply("📢 جاري إرسال الإعلان لجميع الأعضاء...");

      guild.members.cache.forEach(async (member) => {
        if (!member.user.bot) {
          try {
            await member.send({ embeds: [embedAnnounce] });
          } catch {
            console.log(`❌ لم أتمكن من إرسال رسالة إلى ${member.user.tag}`);
          }
        }
      });

      message.reply("✅ تم إرسال الإعلان لجميع الأعضاء.");
    }
  });
};
