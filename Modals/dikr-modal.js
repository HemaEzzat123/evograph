
module.exports = {
  name: "ajer_modal",
  async execute(interaction) {
    try {
      const dhikr = interaction.fields.getTextInputValue("dhikr_input");

      const azkarChannelId = process.env.DIKR_ROOM;
      const channel = interaction.client.channels.cache.get(azkarChannelId);
      if (!channel) {
        throw new Error("قناة الأذكار غير موجودة.");
      }

      await channel.send(`📿 ذكر جديد من ${interaction.user}: ${dhikr}`);

      await interaction.reply({
        content: "✅ تم إرسال الذكر بنجاح!",
        ephemeral: true,
      });
    } catch (error) {
      console.error("❌ Error handling ajer_modal submission:", error);
      await interaction.reply({
        content: "❌ حدث خطأ أثناء إرسال الذكر.",
        ephemeral: true,
      });
    }
  },
};
