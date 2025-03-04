const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  name: "ajer_button",
  async execute(interaction) {
    try {
      const modal = new ModalBuilder()
        .setCustomId("ajer_modal")
        .setTitle("إضافة ذكر");

      const dhikrInput = new TextInputBuilder()
        .setCustomId("dhikr_input")
        .setLabel("اكتب الذكر هنا")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const firstActionRow = new ActionRowBuilder().addComponents(dhikrInput);
      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
    } catch (error) {
      console.error("❌ Error handling ajer_button interaction:", error);
      await interaction.reply({
        content: "❌ حدث خطأ أثناء فتح المودال.",
        ephemeral: true,
      });
    }
  },
};

