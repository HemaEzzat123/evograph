const raidAlertChannelId = "1338621530271383756"; // ضع هنا ID القناة المناسبة

module.exports = (client) => {
  let joinTimestamps = [];

  client.on("guildMemberAdd", (member) => {
    const now = Date.now();
    const timeFrame = 600; // 1 ثانية
    const maxJoins = 5; // الحد الأقصى للانضمامات في ثانية واحدة

    joinTimestamps.push(now);
    joinTimestamps = joinTimestamps.filter(
      (timestamp) => now - timestamp < timeFrame
    );

    if (joinTimestamps.length > maxJoins) {
      member.guild.roles.everyone.setPermissions([]); // تعطيل الصلاحيات

      const raidAlertChannel =
        member.guild.channels.cache.get(raidAlertChannelId);
      if (raidAlertChannel) {
        raidAlertChannel.send(
          "🚨 **تحذير! تم اكتشاف هجوم RAID. تم تعطيل صلاحيات الجميع مؤقتًا.** 🚨"
        );
      }

      setTimeout(() => {
        member.guild.roles.everyone.setPermissions([
          "SEND_MESSAGES",
          "VIEW_CHANNEL",
        ]);
        if (raidAlertChannel) {
          raidAlertChannel.send(
            "✅ **تم إعادة الصلاحيات بعد انتهاء الطوارئ.**"
          );
        }
      }, 300000); // 5 دقائق
    }
  });
};
