
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ajer")
    .setDescription("إضافة أذكار عبر الضغط على زر"),
  async execute(client, interaction) {
    try {
      const addDhikrButton = new ButtonBuilder()
        .setCustomId("ajer_button")
        .setLabel("أضف ذكر")
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(addDhikrButton);

      await interaction.reply({
        content: "اضغط على الزر لإضافة ذكر:",
        components: [row],
        ephemeral: true,
      });
    } catch (error) {
      console.error("❌ Error executing /ajer command:", error);
      await interaction.reply({
        content: "❌ حدث خطأ أثناء تنفيذ الأمر.",
        ephemeral: true,
      });
    }
  },
};

