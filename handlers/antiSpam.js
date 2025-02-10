module.exports = (client) => {
  const userMessages = new Map();

  client.on("messageCreate", (message) => {
    if (message.author.bot || !message.guild) return;

    const userId = message.author.id;
    const now = Date.now();
    const timeLimit = 3000; // 3 ثوانٍ
    const maxMessages = 5; // الحد الأقصى للرسائل المسموح بها

    if (!userMessages.has(userId)) {
      userMessages.set(userId, []);
    }

    const timestamps = userMessages.get(userId);
    timestamps.push(now);

    // إزالة الرسائل القديمة من القائمة
    while (timestamps.length > maxMessages) {
      timestamps.shift();
    }

    if (
      timestamps.length >= maxMessages &&
      timestamps[timestamps.length - 1] - timestamps[0] < timeLimit
    ) {
      message.reply("🚨 **تحذير!** يرجى التوقف عن إرسال الرسائل بسرعة 🚨");
      message.member.timeout(10 * 400000, "Spam Detected"); // إسكات المستخدم لمدة ساعة
    }
  });
};
