const { Client, Events } = require("discord.js");
const mongoose = require("mongoose");

// بناء مخطط (Schema) لقاعدة البيانات
const roleBackupSchema = new mongoose.Schema({
  guildId: String, // ID السيرفر
  roleId: String, // ID الدور
  roleName: String, // اسم الدور
  color: Number, // لون الدور
  hoist: Boolean, // رفع الدور فوق الآخرين
  position: Number, // موقع الدور
  permissions: String, // صلاحيات الدور
  memberIds: [String], // مصفوفة تحتوي على IDs الأعضاء الذين لديهم هذا الدور
  icon: String, // أيقونة الدور
});

// إنشاء نموذج (Model) باستخدام المخطط
const RoleBackup = mongoose.model("RoleBackup", roleBackupSchema);

module.exports = (client) => {
  // تحديث النسخة الاحتياطية عند بدء تشغيل البوت
  client.once(Events.ClientReady, async () => {
    console.log("🤖 البوت جاهز!");
    const guilds = client.guilds.cache;
    guilds.forEach(async (guild) => {
      await updateRoleBackup(guild);
    });
  });

  // تحديث النسخة الاحتياطية عند إضافة عضو جديد
  client.on(Events.GuildMemberAdd, async (member) => {
    await updateRoleBackup(member.guild);
  });

  // استعادة الدور المحذوف
  client.on(Events.GuildRoleDelete, async (role) => {
    console.log(`❌ تم مسح الدور: ${role.name}`);
    await restoreDeletedRole(role.guild, role);
  });

  // دالة لتحديث النسخة الاحتياطية في MongoDB
  async function updateRoleBackup(guild) {
    try {
      console.log(`🔄 تحديث نسخة الأدوار الاحتياطية للسيرفر: ${guild.name}`);

      // حذف السجلات القديمة لهذا السيرفر
      await RoleBackup.deleteMany({ guildId: guild.id });

      // جلب جميع الأعضاء في السيرفر
      const members = await guild.members.fetch();

      // تحضير بيانات الأدوار
      const rolesData = {};
      members.forEach((member) => {
        if (!member.user.bot) {
          member.roles.cache.forEach((role) => {
            if (role.id !== guild.id) {
              if (!rolesData[role.id]) {
                rolesData[role.id] = {
                  guildId: guild.id,
                  roleId: role.id,
                  roleName: role.name,
                  color: role.color,
                  hoist: role.hoist,
                  position: role.position,
                  permissions: role.permissions.bitfield.toString(), // تحويل الصلاحيات إلى سلسلة نصية
                  memberIds: [], // مصفوفة تحتوي على IDs الأعضاء
                  icon: role.icon || "", // حفظ أيقونة الدور إن وجدت
                };
              }
              rolesData[role.id].memberIds.push(member.id); // إضافة ID العضو إلى المصفوفة
            }
          });
        }
      });

      // إدراج البيانات الجديدة في قاعدة البيانات
      await RoleBackup.insertMany(Object.values(rolesData));

      console.log(`✅ تم تحديث نسخة الأدوار الاحتياطية للسيرفر: ${guild.name}`);
    } catch (error) {
      console.error("❌ خطأ أثناء تحديث النسخة الاحتياطية:", error);
    }
  }

  // دالة لإستعادة الدور المحذوف
  async function restoreDeletedRole(guild, deletedRole) {
    try {
      console.log(
        `🔄 محاولة استعادة الدور المحذوف: ${deletedRole.name} (${deletedRole.id})`
      );

      // محاولة العثور على الدور باستخدام الـ ID
      let roleData = await RoleBackup.findOne({
        guildId: guild.id,
        roleId: deletedRole.id,
      });

      // إذا لم يتم العثور عليه، البحث باستخدام الاسم
      if (!roleData) {
        console.log(
          `⚠️ لم يتم العثور على الدور باستخدام ID، يتم البحث باستخدام الاسم...`
        );
        roleData = await RoleBackup.findOne({
          guildId: guild.id,
          roleName: deletedRole.name, // 🔍 البحث باستخدام اسم الدور
        });
      }

      // إذا لم يتم العثور عليه نهائيًا، إيقاف العملية
      if (!roleData) {
        console.log(
          `❌ لم يتم العثور على النسخة الاحتياطية للدور "${deletedRole.name}".`
        );
        return;
      }

      // تحويل معرف الأيقونة إلى رابط Discord CDN
      const roleIcon = roleData.icon
        ? `https://cdn.discordapp.com/role-icons/${roleData.roleId}/${roleData.icon}.png`
        : null;

      // إنشاء الدور
      const restoredRole = await guild.roles.create({
        name: roleData.roleName,
        color: roleData.color,
        hoist: roleData.hoist,
        position: roleData.position,
        permissions: BigInt(roleData.permissions),
        icon: roleIcon,
        reason: "إعادة الدور المحذوف من النسخة الاحتياطية",
      });

      console.log(`✅ تم استعادة الدور: ${restoredRole.name}`);

      // إعادة تعيين الدور للأعضاء
      const members = await guild.members.fetch();
      await Promise.all(
        roleData.memberIds.map(async (memberId) => {
          const member = members.get(memberId);
          if (member) {
            try {
              await member.roles.add(restoredRole);
              console.log(`✅ تم إعادة الدور للعضو: ${member.user.tag}`);
            } catch (err) {
              console.error(
                `❌ لا يمكن إضافة الدور إلى العضو ${member.user.tag}:`,
                err
              );
            }
          }
        })
      );

      console.log("✅ تم إعادة تعيين الدور للأعضاء.");
    } catch (error) {
      console.error("❌ خطأ أثناء استعادة الدور:", error);
    }
  }
};
