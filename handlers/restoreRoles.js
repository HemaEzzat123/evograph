const fs = require("fs");
const { Client, Events, Collection } = require("discord.js");

module.exports = (client) => {
  client.on(Events.GuildMemberAdd, async (member) => {
    // عند إضافة عضو جديد، يتم تحديث النسخة الاحتياطية
    updateRoleBackup(member.guild);
  });

  client.on(Events.GuildRoleDelete, async (role) => {
    console.log(`❌ تم مسح الدور: ${role.name}`);
    restoreDeletedRole(role.guild, role.name);
  });

  // دالة لتحديث النسخة الاحتياطية
  async function updateRoleBackup(guild) {
    const backupData = {};
    const members = await guild.members.fetch();

    members.forEach((member) => {
      if (!member.user.bot) {
        member.roles.cache.forEach((role) => {
          if (role.id !== guild.id) {
            if (!backupData[role.id]) {
              backupData[role.id] = {
                name: role.name,
                color: role.color,
                hoist: role.hoist,
                position: role.position,
                permissions: role.permissions.bitfield,
                members: [],
              };
            }
            backupData[role.id].members.push(member.id);
          }
        });
      }
    });

    // حفظ البيانات في ملف JSON
    fs.writeFileSync("./role-backup.json", JSON.stringify(backupData, null, 2));
    console.log("✅ تم تحديث نسخة الأدوار الاحتياطية.");
  }

  // دالة لإستعادة الدور الممسوح
  async function restoreDeletedRole(guild, roleName) {
    try {
      const backupData = JSON.parse(
        fs.readFileSync("./role-backup.json", "utf8")
      );

      for (const [roleId, roleData] of Object.entries(backupData)) {
        if (roleData.name === roleName) {
          // إعادة إنشاء الدور
          const restoredRole = await guild.roles.create({
            name: roleData.name,
            color: roleData.color,
            hoist: roleData.hoist,
            position: roleData.position,
            permissions: roleData.permissions,
          });

          console.log(`✅ تم استعادة الدور: ${restoredRole.name}`);

          // إعادة تعيين الأدوار للأعضاء
          const membersWithRole = roleData.members;
          const members = await guild.members.fetch();
          membersWithRole.forEach(async (memberId) => {
            const member = members.get(memberId);
            if (member) {
              await member.roles
                .add(restoredRole)
                .catch((err) =>
                  console.error(
                    `❌ لا يمكن إضافة الدور إلى العضو ${memberId}:`,
                    err
                  )
                );
            }
          });

          console.log(`✅ تم إعادة تعيين الدور للأعضاء.`);
          return;
        }
      }

      console.log(
        `⚠️ لم يتم العثور على الدور "${roleName}" في النسخة الاحتياطية.`
      );
    } catch (error) {
      console.error("❌ خطأ أثناء استعادة الدور:", error);
    }
  }
};
