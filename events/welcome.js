require("dotenv").config();
const { EmbedBuilder } = require("discord.js");

module.exports = (client) => {
  client.on("guildMemberAdd", async (member) => {
    const channelId = "1229417339976417372"; // ID قناة الترحيب
    const channel = member.guild.channels.cache.get(channelId);
    const roleId = "905650521459793961"; // استبدل هذا بـ ID الرتبة التي تريد إعطاءها للأعضاء الجدد

    if (!channel || !channel.isTextBased()) {
      console.error(`❌ قناة الترحيب غير موجودة أو غير صالحة.`);
      return;
    }

    let RULES_CHANNEL_ID = process.env.RULES_CHANNEL_ID;
    let INFO_CHANNEL_ID = process.env.INFO_CHANNEL_ID;
    let ANNOUNCEMENTS_CHANNEL_ID = process.env.ANNOUNCEMENTS_CHANNEL_ID;

    try {
      // إضافة الرتبة للعضو الجديد تلقائيًا
      try {
        await member.roles.add(roleId);
        console.log(`✅ تمت إضافة الرتبة للعضو الجديد ${member.user.tag}`);
      } catch (roleError) {
        console.error(`❌ خطأ أثناء إضافة الرتبة للعضو:`, roleError);
      }

      // إنشاء Embed للترحيب
      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`🎉 أهلاً بك ${member.user.username}!`)
        .setDescription(
          `مرحبًا <@${member.id}>, أهلاً بك في **${member.guild.name}**! نأمل أن تقضي وقتًا ممتعًا هنا. 😊\n\nتمت إضافة الرتبة لك تلقائيًا!`
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
        const guild = client.guilds.cache.get(process.env.GUILD_ID);

        await member.send({
          content: `👋 مرحبًا **${member.user.username}**, أهلاً بك في **${member.guild.name}**! 🎉\n\nتمت إضافة الرتبة لك تلقائيًا!`,
          embeds: [
            new EmbedBuilder()
              .setTitle("قوانين وقواعد السيرفر")
              .setFooter({
                text: "EVO GRAPH - الإبداع يبدأ هنا!",
                iconURL: guild?.iconURL({ dynamic: true }),
              })
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
