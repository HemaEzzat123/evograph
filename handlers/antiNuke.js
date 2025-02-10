const { AuditLogEvent, PermissionsBitField } = require("discord.js");

module.exports = (client) => {
  client.on("guildAuditLogEntryCreate", async (entry, guild) => {
    if (!guild) return;

    const { action, executorId, target } = entry;
    const member = await guild.members.fetch(executorId).catch(() => null);
    if (!member) return;

    // إذا كان البوت هو من قام بالحذف، لا تتدخل
    if (member.user.bot) return;

    // إذا كان الـ Owner هو من حذف القناة أو الرتبة، لا تقم بإعادتها
    if (guild.ownerId === member.id) return;

    // منع حذف القنوات إلا بواسطة البوت
    if (action === AuditLogEvent.ChannelDelete) {
      const channelName = target?.name || "قناة جديدة";
      const channelType = target?.type || 0;

      // إعادة إنشاء القناة بنفس الاسم والنوع
      const newChannel = await guild.channels.create({
        name: channelName,
        type: channelType,
        reason: "🚨 تم منع حذف القناة!",
      });

      // تعديل الأذونات لمنع الأعضاء من حذف القنوات
      await newChannel.permissionOverwrites.edit(guild.roles.everyone, {
        [PermissionsBitField.Flags.ManageChannels]: false,
      });

      // السماح للبوت فقط بحذف القنوات
      await newChannel.permissionOverwrites.edit(client.user.id, {
        [PermissionsBitField.Flags.ManageChannels]: true,
      });

      // محاولة حظر المستخدم مع معالجة الأخطاء
      try {
        await member.ban({
          reason: `حاول حذف القناة "${channelName}" بدون إذن.`,
        });
        console.log(
          `❌ ${member.user.tag} حاول حذف القناة "${channelName}"، وتمت إعادتها وتم حظره.`
        );
      } catch (error) {
        console.error("لم يتمكن البوت من حظر المستخدم:", error);
      }
    }

    // منع حذف الرتب إلا بواسطة البوت
    if (action === AuditLogEvent.RoleDelete) {
      const roleName = target?.name || "رتبة جديدة";
      const roleColor = target?.color || "#ffffff";

      // إعادة إنشاء الرتبة بنفس الاسم واللون
      await guild.roles.create({
        name: roleName,
        color: roleColor,
        reason: "🚨 تم منع حذف الرتبة!",
      });

      // محاولة حظر المستخدم مع معالجة الأخطاء
      try {
        await member.ban({
          reason: `حاول حذف الرتبة "${roleName}" بدون إذن.`,
        });
        console.log(
          `❌ ${member.user.tag} حاول حذف الرتبة "${roleName}"، وتمت إعادتها وتم حظره.`
        );
      } catch (error) {
        console.error("لم يتمكن البوت من حظر المستخدم:", error);
      }
    }
  });
};
