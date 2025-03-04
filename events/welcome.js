const { EmbedBuilder } = require("discord.js");

module.exports = (client) => {
  client.on("guildMemberAdd", async (member) => {
    const channelId = "1229417339976417372"; // ID قناة الترحيب
    const channel = member.guild.channels.cache.get(channelId);

    if (!channel || !channel.isTextBased()) {
      console.error(`❌ قناة الترحيب غير موجودة أو غير صالحة.`);
      return;
    }
    let RULES_CHANNEL_ID = process.env.RULES_CHANNEL_ID;
    let INFO_CHANNEL_ID = process.env.INFO_CHANNEL_ID;
    let ANNOUNCEMENTS_CHANNEL_ID = process.env.ANNOUNCEMENTS_CHANNEL_ID;
    try {
      const verifyChannelId = "1338620988635480126"; // استبدل بـ ID القناة الحقيقية
      // إنشاء Embed للترحيب
      const welcomeEmbed = new EmbedBuilder()
        .setTitle(
          `🎉 أهلاً بك ${member.user.username}! --- يرجى التوجه إلى قناة <#${verifyChannelId}> لإكمال عملية التحقق.`
        )
        .setDescription(
          `مرحبًا <@${member.id}>, أهلاً بك في **${member.guild.name}**! نأمل أن تقضي وقتًا ممتعًا هنا. 😊`
        )
        .setColor("#f1645f")
        .setImage(
          "https://cdn.discordapp.com/attachments/1024348162820935680/1340810996050169907/welcome.gif?ex=67b8544c&is=67b702cc&hm=6548086a7f169a14338f1bf0a65f057ddb7eda2216c1a9cc8a239564f5797835&"
        )
        .setThumbnail(
          member.user.displayAvatarURL({ dynamic: true, size: 512 })
        )
        .setTimestamp()
        .setFooter({ text: `عضو رقم #${member.guild.memberCount}` });

      // إرسال الرسالة في قناة الترحيب
      await channel.send({
        content: `أهلاً بك في السيرفر، <@${member.id}>!`,
        embeds: [welcomeEmbed],
      });

      // إرسال رسالة خاصة للعضو الجديد
      try {
        const verifyChannelId = "1338620988635480126"; // استبدل بـ ID القناة الحقيقية
        const verifyChannel = member.guild.channels.cache.get(verifyChannelId);

        if (!verifyChannel || !verifyChannel.isTextBased()) {
          console.error(`❌ قناة التحقق غير صالحة.`);
        } else {
          await member.send({
            content: `👋 مرحبًا **${member.user.username}**, أهلاً بك في **${member.guild.name}**! 🎉\n\nيرجى التوجه إلى قناة <#${verifyChannelId}> لإكمال عملية التحقق.`,
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
                .addFields(
                  {
                    name: `[📜] <#${RULES_CHANNEL_ID}>`,
                    value: "For Rules",
                    inline: false,
                  },
                  {
                    name: `[🌿] <#${INFO_CHANNEL_ID}>`,
                    value: "For Any Information",
                    inline: false,
                  },
                  {
                    name: `[📢] <#${ANNOUNCEMENTS_CHANNEL_ID}>`,
                    value: "For Any News",
                    inline: false,
                  }
                )
                .setColor("#f1645f"),
            ],
          });
        }
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
