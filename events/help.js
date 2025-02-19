const { EmbedBuilder } = require("discord.js");

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.content.toLowerCase() !== "!help") return;

    const helpEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("📚 قائمة الأوامر المتاحة")
      .setDescription("هذه قائمة بجميع الأوامر المتاحة في السيرفر")
      .addFields(
        {
          name: "🛡️ أوامر الحماية",
          value: `
• مكافحة السبام
• مكافحة الروابط
• حماية من النيوك
• حماية من الرايد
• حماية البوتات
• حماية المالك`,
          inline: false,
        },
        {
          name: "🤖 أوامر البوت",
          value: `
• !help - عرض قائمة الأوامر
• !clear [العدد] - مسح عدد محدد من الرسائل`,
          inline: false,
        },
        {
          name: "🎫 نظام التذاكر",
          value: `
• نظام التذاكر العادي
• نظام تذاكر الدعم الفني`,
          inline: false,
        },
        {
          name: "👋 أنظمة الترحيب",
          value: `
• نظام الترحيب التلقائي
• نظام التحقق
• رسائل الأعضاء الجدد`,
          inline: false,
        },
        {
          name: "💬 أنظمة الرسائل",
          value: `
• الرد التلقائي على الرسائل
• نظام الرسائل في القنوات المحددة`,
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({
        text: `Requested by ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL(),
      });

    try {
      await message.reply({ embeds: [helpEmbed] });
    } catch (error) {
      console.error("❌ خطأ في إرسال رسالة المساعدة:", error);
      message.reply("🚫 حدث خطأ أثناء محاولة عرض قائمة الأوامر.");
    }
  });
};
