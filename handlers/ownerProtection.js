const { AuditLogEvent, PermissionsBitField } = require("discord.js");

module.exports = (client) => {
  client.on("guildAuditLogEntryCreate", async (entry) => {
    const { action, executor, target, guild } = entry;

    if (!guild || !guild.ownerId) return;
    const owner = await guild.members.fetch(guild.ownerId).catch(() => null);
    if (!owner) return;

    const member = await guild.members.fetch(executor.id).catch(() => null);
    if (!member || member.id === guild.ownerId) return; // تجاهل المالك

    // حماية من محاولة حذف أو تعديل صلاحيات المالك
    if (
      action === AuditLogEvent.MemberRoleUpdate &&
      target.id === guild.ownerId
    ) {
      await target.roles.set(owner.roles.cache);
      await member.kick({ reason: "🚨 محاولة تعديل صلاحيات المالك!" });
      console.log(`❌ ${executor.tag} حاول تعديل صلاحيات الأونر وتم طرده!`);
    }

    // منع طرد أو باند الأونر
    if (
      (action === AuditLogEvent.MemberKick ||
        action === AuditLogEvent.MemberBanAdd) &&
      target.id === guild.ownerId
    ) {
      await guild.members.unban(target.id).catch(() => null);
      await member.kick({ reason: "🚨 محاولة طرد المالك!" });
      console.log(`❌ ${executor.tag} حاول طرد الأونر وتم طرده!`);
    }

    // تنبيه عند محاولة تغيير الأونرشيب
    if (action === AuditLogEvent.OwnerUpdate) {
      console.log(
        `⚠️ محاولة نقل ملكية السيرفر من ${target.tag} إلى ${executor.tag}`
      );
    }

    // منع إضافة أدوار أعلى من المالك
    const ownerRole = guild.roles.cache.find((role) => role.name === "OWNER"); // تأكد من أن هذا هو اسم الدور
    if (!ownerRole) return;

    // إذا كانت هناك محاولة لتعديل أدوار أكبر من المالك
    if (action === AuditLogEvent.MemberRoleUpdate) {
      const oldRoles = entry.changes.find((change) => change.key === "roles");
      if (oldRoles) {
        const addedRole = oldRoles.new[0];
        if (addedRole && addedRole.position > ownerRole.position) {
          // إلغاء إضافة الدور
          const targetMember = await guild.members.fetch(target.id);
          await targetMember.roles.remove(
            addedRole,
            "🚨 لا يمكن إضافة رتبة أعلى من المالك!"
          );
          await member.kick({ reason: "🚨 محاولة إضافة رتبة أعلى من المالك!" });
          console.log(
            `❌ ${executor.tag} حاول إضافة رتبة أعلى من المالك وتم طرده!`
          );
        }
      }
    }
  });
};
