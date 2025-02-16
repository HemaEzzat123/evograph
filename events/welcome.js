const { AttachmentBuilder } = require("discord.js");
const Canvas = require("canvas");
const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");

module.exports = (client) => {
  client.on("guildMemberAdd", async (member) => {
    const channelId = "1229417339976417372"; // ضع هنا ID القناة
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const outputGif = path.join(__dirname, "output.gif");
    const backgroundGif = path.join(__dirname, "welcome.gif"); // ضع هنا ملف GIF المتحرك

    // تحميل صورة العضو
    const avatar = await Canvas.loadImage(
      member.user.displayAvatarURL({ extension: "png", size: 256 })
    );

    // إنشاء صورة PNG تحتوي على صورة العضو واسمه
    const canvas = Canvas.createCanvas(500, 500);
    const ctx = canvas.getContext("2d");

    // إضافة صورة العضو داخل دائرة
    ctx.beginPath();
    ctx.arc(250, 150, 70, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 180, 80, 140, 140);

    // إضافة اسم المستخدم
    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(`${member.user.username}`, 250, 280);

    // حفظ الصورة كملف PNG مؤقت
    const avatarOverlay = path.join(__dirname, "overlay.png");
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(avatarOverlay, buffer);

    // استخدام ffmpeg لدمج الصورة مع GIF متحركة
    ffmpeg()
      .input(backgroundGif)
      .input(avatarOverlay)
      .complexFilter(["[0:v][1:v] overlay=(W-w)/2:(H-h)/2 [out]"])
      .outputOptions(["-movflags faststart", "-pix_fmt yuv420p"])
      .save(outputGif)
      .on("end", async () => {
        // إرسال GIF النهائي إلى القناة
        const attachment = new AttachmentBuilder(outputGif, {
          name: "welcome.gif",
        });

        channel.send({
          content: `🎉 Welcome <@${member.id}> to **${member.guild.name}**!`,
          files: [attachment],
        });

        // حذف الملفات المؤقتة بعد الإرسال
        fs.unlinkSync(avatarOverlay);
        fs.unlinkSync(outputGif);
      })
      .on("error", (err) => console.error("FFmpeg Error:", err));
  });
};
