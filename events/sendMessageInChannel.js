module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase().startsWith("!message")) {
      try {
        // اسم القناة المطلوبة
        const ticketChannelName = "🎫┋open-ticket";

        // البحث عن القناة داخل السيرفر
        const ticketChannel = message.guild.channels.cache.find(
          (ch) => ch.name === ticketChannelName
        );

        // التحقق من وجود القناة
        const ticketMention = ticketChannel
          ? `<#${ticketChannel.id}>`
          : `**#${ticketChannelName}**`;

        // إنشاء Embed جديد لتعريف EVO GRAPH
        const evoGraphEmbed = {
          color: 0x651419, // لون خلفية داكن
          title: "🚀 **مرحبًا بك في EVO GRAPH** 🎨",
          description:
            `🌟 **تعريف عن EVO GRAPH:**\n` +
            `تتكون كلمة **Evo Graph** من جزئين:\n` +
            `- 🌀 **Evo**: مشتقة من "Evolution" وتعني **التطور**.\n` +
            `- 🎨 **Graph**: مشتقة من "Graphic" وتم اختصارها.\n\n` +
            `🔹 **EVO GRAPH** هو متجر متخصص في **تصميم الجرافيك، الموشن جرافيك، المونتاج**، ومتخصصون في مجال **Gaming & Streaming** بجودة عالية وأسعار تنافسية.\n\n` +
            `━━━━━━━━━━━━━━━\n` +
            `✨ **ما يميز EVO GRAPH؟**\n` +
            `✅ **خبرة واسعة:** لدينا خبرة **تصل إلى 8 سنوات** في مجال التصميم، و**4 سنوات** خبرة في تصميم وتطوير محتوى **FiveM**.\n` +
            `✅ **جودة عالية:** جميع التصاميم تتميز بالاحترافية والإبداع.\n` +
            `✅ **أسعار تنافسية:** نضمن لك أفضل سعر مقابل الجودة.\n` +
            `✅ **خدمة عملاء متميزة:** نحرص على توفير تجربة رائعة لعملائنا.\n\n` +
            `💡 **لماذا ننصحك بالتسوق من EVO GRAPH؟**\n` +
            `🔸 تجربة تسوق **فريدة وممتعة**.\n` +
            `🔸 منتجات وخدمات **عالية الجودة** بأسعار **تنافسية**.\n` +
            `🔸 دعم فني متواصل واهتمام بأدق التفاصيل.\n\n` +
            `📩 **للطلب أو الاستفسار:**\n` +
            `🎟 **افتح تذكرة في** ${ticketMention} **للتواصل معنا مباشرة!**\n\n` +
            `🔗 **تابعنا لمزيد من العروض والتصاميم الحصرية!**\n\n` +
            `📢 **شكرًا لك على وقتك، ونتطلع لخدمتك قريبًا!** 🙌`,
          footer: {
            text: "EVO GRAPH - الإبداع يبدأ هنا!",
            icon_url:
              "https://res.cloudinary.com/dxfyhkj2l/image/upload/fl_preserve_transparency/v1739545365/Screenshot_2025-02-12_143112_lahkok.jpg?_s=public-apps", // ضع رابط شعار المتجر هنا إن وجد
          },
        };

        // إرسال الرسالة الجديدة
        const sentMessage = await message.channel.send({
          embeds: [evoGraphEmbed],
        });

        // تثبيت الرسالة
        await sentMessage.pin();

        // حذف رسالة نظام التثبيت
        const fetchedMessages = await message.channel.messages.fetch({
          limit: 1,
        });
        const systemPinMessage = fetchedMessages.first();
        if (systemPinMessage?.system) {
          await systemPinMessage.delete();
        }

        // حذف رسالة الأمر الأصلية
        await message.delete();
      } catch (error) {
        console.error("❌ Error:", error);
        if (error.message.includes("Missing Permissions")) {
          await message.reply("❌ البوت لا يملك صلاحيات كافية");
        } else {
          await message.reply("❌ حدث خطأ أثناء إرسال أو تثبيت الرسالة");
        }
      }
    }
  });
};
