const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
} = require("discord.js");

module.exports = (client) => {
  client.on("guildMemberAdd", async (member) => {
    try {
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
    } catch (error) {
      console.error("Error in guildMemberAdd event:", error);
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (!interaction.isButton()) return;

      // التحقق مما إذا كان التفاعل يتعلق بعملية التحقق من الأعضاء
      if (!interaction.customId.startsWith("verify_button_")) return;

      // استخراج معرف العضو من معرف الزر
      const expectedMemberId = interaction.customId.replace(
        "verify_button_",
        ""
      );
      const member = interaction.member;

      // التأكد من أن العضو هو نفس الشخص الذي تلقى رسالة التحقق
      if (member.id !== expectedMemberId) {
        // استخدام deferReply مباشرة لتجنب خطأ Unknown interaction
        await interaction.deferReply({ ephemeral: true });
        await interaction.editReply({
          content:
            "❌ لا يمكنك الضغط على هذا الزر. فقط العضو الجديد يمكنه التحقق.",
        });
        return;
      }

      // استخدام deferReply لعملية التحقق الناجحة
      await interaction.deferReply({ ephemeral: true });

      const roleId = "905650521459793961"; // ضع هنا ID الخاص بالدور

      if (!member.roles.cache.has(roleId)) {
        try {
          await member.roles.add(roleId);
          await interaction.editReply({
            content: "✅ **تم التحقق منك!**",
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
        } catch (roleError) {
          console.error("Error adding role:", roleError);
          await interaction.editReply({
            content: "❌ حدث خطأ أثناء إضافة الدور. يرجى الاتصال بالإدارة.",
          });
        }
      } else {
        await interaction.editReply({
          content: "❗ **أنت بالفعل تم التحقق منك.**",
        });
      }
    } catch (error) {
      console.error("Error in verification interaction:", error);
      // محاولة إرسال رسالة خطأ إذا كان ذلك ممكنًا
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content:
              "حدث خطأ أثناء عملية التحقق. يرجى المحاولة مرة أخرى لاحقًا.",
            ephemeral: true,
          });
        } else if (interaction.deferred) {
          await interaction.editReply({
            content:
              "حدث خطأ أثناء عملية التحقق. يرجى المحاولة مرة أخرى لاحقًا.",
          });
        }
      } catch (replyError) {
        console.error("Error sending error message:", replyError);
      }
    }
  });

  console.log("✅ Verification system loaded successfully");
};
