module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    // معرف القناة المستهدفة
    const targetChannelId = "1229393201165762590";

    // تجاهل رسائل البوتات والتأكد من أنها في القناة الصحيحة
    if (message.author.bot || message.channel.id !== targetChannelId) return;

    try {
      // قائمة الإيموجيات بمعرفاتها
      const emojiIds = [
        "1247508701388996648",
        "1247509981088059423",
        "831080943078604850",
        "831134664906506270",
        "831134664457715723",
        "920568970090790963",
      ];

      // تطبيق ردود الفعل
      for (const emojiId of emojiIds) {
        const emoji = client.emojis.cache.get(emojiId);
        if (emoji) {
          await message.react(emoji);
        } else {
          console.warn(`⚠️ الإيموجي بمعرف ${emojiId} غير متاح.`);
        }
      }
    } catch (error) {
      console.error("❌ فشل في إضافة ردود الفعل:", error);
    }
  });
};
