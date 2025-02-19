const { EmbedBuilder } = require("discord.js");

module.exports = (client) => {
  client.on("guildMemberAdd", async (member) => {
    const channelId = "1229417339976417372";
    const channel = member.guild.channels.cache.get(channelId);

    if (!channel || !channel.isTextBased()) {
      console.error(`❌ قناة الترحيب غير موجودة أو غير صالحة.`);
      return;
    }

    try {
      // إنشاء Embed للترحيب
      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`🎉 أهلاً بك ${member.user.username}!`)
        .setDescription(
          `مرحبًا <@${member.id}>, أهلاً بك في **${member.guild.name}**! نأمل أن تقضي وقتًا ممتعًا هنا. 😊`
        )
        .setColor("#00ff00")
        // إضافة GIF كصورة رئيسية
        .setImage(
          "https://cdn.discordapp.com/attachments/1024348162820935680/1340810996050169907/welcome.gif?ex=67b702cc&is=67b5b14c&hm=443df0f3c3927be9461cb9caf85321f7895cc14011530e601dad6fcb036add17&"
        ) // ضع رابط الـ GIF هنا
        // إضافة صورة المستخدم كصورة مصغرة
        .setThumbnail(
          member.user.displayAvatarURL({ dynamic: true, size: 512 })
        )
        .setTimestamp()
        .setFooter({ text: `عضو رقم #${member.guild.memberCount}` });

      // إرسال الرسالة
      await channel.send({
        content: `أهلاً بك في السيرفر، <@${member.id}>!`,
        embeds: [welcomeEmbed],
      });

      // إرسال رسالة خاصة للعضو الجديد
      try {
        await member.send({
          content: `👋 مرحبًا **${member.user.username}**, أهلاً بك في **${member.guild.name}**! 🎉`,
          embeds: [
            new EmbedBuilder()
              .setTitle("قوانين وقواعد السيرفر")
              .setDescription(
                "📜 **القوانين:**\n" +
                  "1️⃣ احترام الجميع.\n" +
                  "2️⃣ عدم إرسال رسائل مزعجة.\n" +
                  "3️⃣ الالتزام بشروط Discord.\n\n" +
                  "استمتع بالبقاء معنا! 😊"
              )
              .setColor("#00ff00"),
          ],
        });
      } catch (err) {
        console.log(
          `❌ لم يتمكن البوت من إرسال رسالة خاصة إلى ${member.user.tag}`
        );
      }
    } catch (error) {
      console.error(`❌ خطأ أثناء إرسال رسالة الترحيب:`, error);
    }
  });
};
