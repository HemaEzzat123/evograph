const { EmbedBuilder } = require("discord.js");

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    // تجاهل الرسائل الصادرة من البوتات
    if (message.author.bot) return;

    // التحقق مما إذا كان الأمر هو "!help"
    if (message.content.toLowerCase() !== "!help") return;

    // التحقق مما إذا كان المستخدم لديه صلاحية ADMINISTRATOR
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply(
        "🚫 ليس لديك إذن لاستخدام هذا الأمر. يجب أن تكون لديك صلاحية `ADMINISTRATOR`."
      );
    }

    // إنشاءEmbed للمساعدة
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
• !clear [العدد] - مسح عدد محدد من الرسائل
• !message - ارسال رسالة مخصصه وتثبيتها في القناة
• !announce - ارسال رسالة الى جميع اعضاء السيرفر
• /invoice [amount] [user] [email] [currency] [recurring] - paypal invoice
• /list - عرض الفواتير الحاليه
`,
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
