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
      .setCustomId("verify_button")
      .setLabel("✅ اضغط هنا للتحقق")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(verifyButton);

    // إرسال الرسالة مع الزر، وهي ستكون مرئية فقط للعضو الجديد
    const sentMessage = await verificationChannel.send({
      content: `👋 مرحبًا ${member}, من فضلك اضغط على الزر أدناه لتأكيد أنك لست بوت.`,
      components: [row],
      ephemeral: true, // الرسالة ستكون مرئية فقط لهذا العضو
    });

    // إضافة توقيت لحذف الرسائل القديمة بعد فترة معينة
    setTimeout(async () => {
      // حذف الرسائل بعد فترة من الزمن
      await sentMessage.delete();
    }, 300); // 30 ثانية
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;

    // التحقق من العضو الذي أنشأ التفاعل
    if (interaction.customId === "verify_button") {
      const member = interaction.member;
      if (member.id !== interaction.user.id) {
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
          ephemeral: true, // الرسالة ستكون مرئية فقط لهذا العضو
        });
      } else {
        await interaction.reply({
          content: "❗ **أنت بالفعل تم التحقق منك.**",
          ephemeral: true, // الرسالة ستكون مرئية فقط لهذا العضو
        });
      }
    }
  });
};
