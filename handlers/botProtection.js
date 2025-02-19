const allowedBots = ["", ""]; // ضع هنا معرفات البوتات الموثوقة

module.exports = (client) => {
  client.on("guildMemberAdd", async (member) => {
    if (member.user.bot) {
      // إذا كان العضو بوتًا وتعرفه بالفعل في القائمة
      if (!allowedBots.includes(member.id)) {
        try {
          await member.kick(); // طرد البوت
          console.log(`🚫 تم طرد البوت غير الموثوق: ${member.user.tag}`);
        } catch (error) {
          console.error("❌ فشل طرد البوت:", error);
        }
      }
    }
  });

  client.on("guildAuditLogEntryCreate", async (entry) => {
    // تحقق من نوع الحدث إذا كان إضافة بوت
    if (entry.action === "BOT_ADD") {
      const executor = entry.executor; // العضو الذي قام بإضافة البوت
      const target = entry.target; // البوت الذي تم إضافته

      // إذا كان البوت غير موثوق
      if (!allowedBots.includes(target.id)) {
        try {
          // طرد البوت
          await target.kick();
          console.log(`🚫 تم طرد البوت غير الموثوق: ${target.tag}`);

          // طرد العضو الذي أضاف البوت
          await executor.kick();
          console.log(
            `🚫 تم طرد العضو الذي أضاف البوت غير الموثوق: ${executor.tag}`
          );
        } catch (error) {
          console.error("❌ فشل طرد البوت أو العضو:", error);
        }
      }
    }
  });
};
