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
          color: 0xf1645f, // لون خلفية داكن
          // title: "🚀 **مرحبًا بك في EVO GRAPH** 🎨",
          image: {
            url: "https://media.discordapp.net/attachments/1342144217111334912/1342155497024913539/d65ae60f2fcc5d54.png?ex=67b89b36&is=67b749b6&hm=74d1a36bf6ea8c4c3f724a8a8b673b8f94decef612e48f0d2fc0e7b8d917a662&=&format=webp&quality=lossless&width=1056&height=377", // استبدل هذا برابط الصورة التي تريد عرضها
          },
          // description:
          //   `بِسْمِ اللَّـهِ الرَّحْمَـٰنِ الرَّحِيمِ \`***قوانين المتجر***\`\n\n` +
          //   `1- الدفع يتم قبل بدء العمل على التصميم\n\n` +
          //   `2- لا يمكن استرجاع اى مبالغ مالية بعد البدء فى التصميم\n\n` +
          //   `3- يحق للعميل طلب تعديلين ( 2 ) فقط على التصميم\n\n` +
          //   `4- المصمم له الحق الكامل فى نشر تصميمك داخل المتجر لغرض العرض فقط\n\n` +
          //   `5- يمنع طلب تصميم مجاني\n\n` +
          //   `6- التواصل مع المصمم عن الطريق التكت فقط\n\n` +
          //   `7- ضريبة الدفع والأسترجاع يتحملها العميل بالكامل\n\n` +
          //   `8- نخلى المسؤولية عن اي شخص يسرق منتجك بعد التسليم\n\n` +
          //   `9- ممنوع طلب التسريع بالتصميم\n\n` +
          //   `10- عند الموافقة على التصميم من قبل العميل لايمكن إعاده تعديله مره أخرى\n\n` +
          //   `11- نحن غير مسؤولين فى حال غيرت قرارك ونظرتك على الخدمة بعد مرور مدة\n\n` +
          //   `12- التعامل مباشرةً يكون من العميل الي ( اونر السيرفر ) ولا نسمح بالوساطة\n\n` +
          //   `13- يمنع التعديل على إي من التصميمات لـ صالح سيرفر أخر غير المتفق عليه\n\n` +
          //   `14- ملفات التصميم يتم تسليمها لصاحب البرمشن فقط\n\n` +
          //   `15- يتم تسليم الطلب مرة واحدة فقط و اي تعديل للشكل كامل بعد التسليم يتم دفع سعر الطلب\n\n` +
          //   `16- فى حال تم الإتفاق على رسم شعار معين وبعد الرسم تخلف عنه العميل يتم خصم نصف سعر الشعار\n\n` +
          //   `17- ممنوع طلب التصميم مفتوح (PSD , AI , AEP)\n\n` +
          //   `18- في حال تم الطلب منتج و الخروج من الدسكورد سوف يتم اغلاق التكت و عدم ارجاع المبلغ في حال تم البدء في المنتج\n\n` +
          //   `19- ممنوع نهائياً طلب نقل الرتب فى أي حال من الأحوال\n\n` +
          //   `20- بعد فتح التيكت اكتب كل طلباتك حتي يتم الرد عليكم من قبل المصمم\n\n` +
          //   `21- يجب شرح وافي لطلبك مع ذكر الالوان اللتي تريدها\n\n` +
          //   `22- جميع القوانين قابلة للتعديل\n\n` +
          //   `**شكراً علي حسن تعاونكم معنا نتمني لكم دائماً الأفضل**`,
          // footer: {
          //   text: "EVO GRAPH - الإبداع يبدأ هنا!",
          //   icon_url:
          //     "https://res.cloudinary.com/dxfyhkj2l/image/upload/fl_preserve_transparency/v1739545365/Screenshot_2025-02-12_143112_lahkok.jpg", // رابط شعار المتجر
          // },
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
