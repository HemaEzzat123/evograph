const { EmbedBuilder } = require("discord.js");

module.exports = (client) => {
  client.on("guildMemberAdd", async (member) => {
    const channelId = "1229417339976417372"; // ضع هنا ID القناة
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    // إنشاء Embed برسالة ترحيب
    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`🎉 Welcome ${member.user.username}!`)
      .setDescription(
        `Hey <@${member.id}>, welcome to **${member.guild.name}**! We hope you have a great time here. 😊`
      )
      .setColor("#00ff00")
      .setImage(
        "https://cdn.discordapp.com/attachments/1024348162820935680/1340810996050169907/welcome.gif?ex=67b5b14c&is=67b45fcc&hm=e27fb9ec4cc89a3063d7347c367e49649d4f829e88ad3a08b25f1fbdc4316473&"
      ); // ضع رابط GIF هنا

    // إرسال الرسالة في القناة
    channel.send({ embeds: [welcomeEmbed] });

    // إرسال رسالة ترحيب خاصة للعضو الجديد
    try {
      await member.send(
        `👋 Hey **${member.user.username}**, welcome to **${member.guild.name}**! 🎉\n\n📜 **Rules:**\n1️⃣ Be respectful\n2️⃣ No spam\n3️⃣ Follow Discord's ToS\n\nEnjoy your stay! 😊`
      );
    } catch (err) {
      console.log(`❌ لم أستطع إرسال رسالة خاصة إلى ${member.user.tag}`);
    }
  });
};
