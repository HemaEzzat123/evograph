const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
} = require("discord.js");

module.exports = (client) => {
  client.on("guildMemberAdd", async (member) => {
    const verificationChannel = client.channels.cache.get(
      process.env.VERIFICATION_CHANNEL_ID
    );
    if (!verificationChannel) return;

    // إنشاء زر التحقق
    const verifyButton = new ButtonBuilder()
      .setCustomId(`verify_button_${member.id}`) // استخدام ID مخصص لكل عضو
      .setLabel("✅ اضغط هنا للتحقق")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(verifyButton);

    // إرسال الرسالة مع زر التحقق
    const sentMessage = await verificationChannel.send({
      content: `👋 مرحبًا ${member}, من فضلك اضغط على الزر أدناه لتأكيد أنك لست بوت.`,
      components: [row],
    });

    // حفظ ID الرسالة حتى يتمكن العضو من التفاعل معها لاحقًا
    client.verificationMessages = client.verificationMessages || {};
    client.verificationMessages[member.id] = sentMessage.id;
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;

    const member = interaction.member;
    const buttonId = interaction.customId;
    const expectedButtonId = `verify_button_${member.id}`;

    // التأكد من أن العضو هو نفس الشخص الذي تلقى رسالة التحقق
    if (buttonId !== expectedButtonId) {
      await interaction.reply({
        content:
          "❌ لا يمكنك الضغط على هذا الزر. فقط العضو الجديد يمكنه التحقق.",
        ephemeral: true,
      });
      return;
    }

    const roleId = "905650521459793961"; // ضع هنا ID الخاص بالدور

    if (!member.roles.cache.has(roleId)) {
      await member.roles.add(roleId);
      await interaction.reply({
        content: "✅ **تم التحقق منك!**",
        ephemeral: true,
      });

      // حذف رسالة التحقق بعد نجاح التحقق
      const sentMessageId = client.verificationMessages?.[member.id];
      if (sentMessageId) {
        const verificationChannel = interaction.channel;
        const sentMessage = await verificationChannel.messages
          .fetch(sentMessageId)
          .catch(() => null);
        if (sentMessage) await sentMessage.delete();
        delete client.verificationMessages[member.id];
      }
    } else {
      await interaction.reply({
        content: "❗ **أنت بالفعل تم التحقق منك.**",
        ephemeral: true,
      });
    }
  });
};
