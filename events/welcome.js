const { createCanvas, loadImage } = require("canvas");
const GifEncoder = require("gif-encoder-2");
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const axios = require("axios");

async function createWelcomeGif(userAvatarURL, outputPath) {
  const gifWidth = 500;
  const gifHeight = 250;

  const gif = new GifEncoder(gifWidth, gifHeight);
  gif.setDelay(100); // سرعة الحركة بين الإطارات
  gif.setRepeat(0); // تكرار إلى الأبد
  gif.start();

  // استبدل هذه الروابط بصور الإطارات الفعلية المستخرجة من GIF الأصلي
  const frames = [
    "https://cdn.discordapp.com/attachments/1024348162820935680/1340810996050169907/welcome.gif?ex=67b5b14c&is=67b45fcc&hm=e27fb9ec4cc89a3063d7347c367e49649d4f829e88ad3a08b25f1fbdc4316473&",
    "https://cdn.discordapp.com/attachments/1024348162820935680/1340810996050169907/welcome.gif?ex=67b5b14c&is=67b45fcc&hm=e27fb9ec4cc89a3063d7347c367e49649d4f829e88ad3a08b25f1fbdc4316473&",
    "https://cdn.discordapp.com/attachments/1024348162820935680/1340810996050169907/welcome.gif?ex=67b5b14c&is=67b45fcc&hm=e27fb9ec4cc89a3063d7347c367e49649d4f829e88ad3a08b25f1fbdc4316473&",
  ];

  const avatar = await loadImage(userAvatarURL);

  for (const frameUrl of frames) {
    const frame = await loadImage(frameUrl);
    const canvas = createCanvas(gifWidth, gifHeight);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(frame, 0, 0, gifWidth, gifHeight);

    const avatarSize = 80;
    const avatarX = 200;
    const avatarY = 80;

    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2,
      true
    );
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);

    gif.addFrame(ctx);
  }

  gif.finish();
  fs.writeFileSync(outputPath, gif.out.getData());
  console.log("✅ GIF Created Successfully!");
}

module.exports = (client) => {
  client.on("guildMemberAdd", async (member) => {
    const channelId = "1229417339976417372";
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const gifPath = `welcome_${member.id}.gif`;

    await createWelcomeGif(
      member.user.displayAvatarURL({ format: "png" }),
      gifPath
    );

    const attachment = new AttachmentBuilder(gifPath);

    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`🎉 Welcome ${member.user.username}!`)
      .setDescription(
        `Hey <@${member.id}>, welcome to **${member.guild.name}**! We hope you have a great time here. 😊`
      )
      .setColor("#00ff00")
      .setImage(`attachment://${gifPath}`);

    channel.send({ embeds: [welcomeEmbed], files: [attachment] });

    try {
      await member.send(
        `👋 Hey **${member.user.username}**, welcome to **${member.guild.name}**! 🎉\n\n📜 **Rules:**\n1️⃣ Be respectful\n2️⃣ No spam\n3️⃣ Follow Discord's ToS\n\nEnjoy your stay! 😊`
      );
    } catch (err) {
      console.log(`❌ لم أستطع إرسال رسالة خاصة إلى ${member.user.tag}`);
    }

    // حذف الملف بعد الإرسال لتوفير المساحة
    fs.unlinkSync(gifPath);
  });
};
