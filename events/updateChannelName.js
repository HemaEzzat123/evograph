const { Events } = require("discord.js");

module.exports = (client) => {
  client.on(Events.ClientReady, async () => {
    try {
      const guild = client.guilds.cache.first(); // جلب السيرفر الأول الذي ينتمي إليه البوت
      if (!guild) return console.error("❌ لا يوجد سيرفر متصل بالبوت.");

      const channel = guild.channels.cache.get("1341935637116227644"); // استبدل بالـ ID الخاص بالقناة
      if (!channel)
        return console.error("❌ لم يتم العثور على القناة المحددة.");

      const emoji = "<:China_Skin_Tier_4:1342153727364305047>"; // استبدل "emoji_name" بالاسم الفعلي
      channel.setName(`china_skin_tier_4 `); // استبدل 🔥 بالإيموجي المناسب

      console.log("✅ تم تحديث اسم القناة بنجاح!");
    } catch (error) {
      console.error("❌ حدث خطأ أثناء تحديث اسم القناة:", error);
    }
  });
};
