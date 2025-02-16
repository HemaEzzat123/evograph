module.exports = (client) => {
  // قائمة الباقات والأسعار
  const packages = {
    "3D Super Cinematic": "350$",
    "Super Extra": "300$",
    "GOLD Package": "200$",
    "ULTRA Package": "130$",
    "MEGA Package": "80$",
    "STREAM Package 1": "200$",
    "STREAM Package 2": "70$",
    "Community Package": "$50",
    "LOADING SCREEN": "$70",
    ESX: "45$",
    CFW: "45$",
    DISCORD: "30$",
    "VIP DISCORD": "60$",
    "2D Design": "5$",
    "2D Design animated": "10$",
  };

  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    // عند كتابة !packages سيتم إرسال القائمة
    if (message.content === "!packages") {
      const packageList = Object.keys(packages)
        .map((pkg) => `📦 **${pkg}**`)
        .join("\n");

      await message.channel.send(
        `🎁 **قائمة الباقات المتاحة:**\n${packageList}\n\n📝 **للحصول على سعر أي باقة، اكتب اسمها فقط في الشات!**`
      );
    }

    // التحقق مما إذا كان المستخدم كتب اسم باقة لمعرفة سعرها
    if (packages[message.content]) {
      await message.reply(
        ` ** ${message.content} = ${packages[message.content]}** 💰`
      );
    }
  });
};
