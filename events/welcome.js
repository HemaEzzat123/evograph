const { AttachmentBuilder } = require("discord.js");
const Canvas = require("canvas");

module.exports = (client) => {
  client.on("guildMemberAdd", async (member) => {
    const channelId = "1229417339976417372"; // ضع هنا ID القناة
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    // إعداد Canvas
    const canvas = Canvas.createCanvas(1104, 637);
    const ctx = canvas.getContext("2d");

    // تحميل الخلفية
    const background = await Canvas.loadImage(
      "https://probot.media/IzIdPPnqle.png"
    );
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // إعداد النصوص
    ctx.font = "bold 55px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(`${member.user.username}`, canvas.width / 2, 250);

    // تحميل صورة البروفايل
    const avatar = await Canvas.loadImage(
      member.user.displayAvatarURL({ extension: "jpg", size: 256 })
    );

    // رسم دائرة للرمز الشخصي مع الإطار
    const avatarX = canvas.width / 2 - 75;
    const avatarY = 50;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 140, 70, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, canvas.width / 2 - 70, 70, 140, 140);

    // إعادة رسم الإطار حول صورة البروفايل
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 140, 70, 0, Math.PI * 2, true);
    ctx.stroke();

    // تحويل الصورة إلى مرفق
    const attachment = new AttachmentBuilder(canvas.toBuffer(), {
      name: "welcome-image.png",
    });

    // إرسال رسالة الترحيب إلى القناة
    channel.send({
      content: `🎉 Welcome <@${member.id}> to **${member.guild.name}**!`,
      files: [attachment],
    });

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
