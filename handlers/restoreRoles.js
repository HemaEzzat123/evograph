const { Client, Events, GatewayIntentBits } = require("discord.js");
const mongoose = require("mongoose");

// Database Schema for Role Backup
const roleBackupSchema = new mongoose.Schema({
  guildId: String,
  roleId: String,
  roleName: String,
  color: Number,
  hoist: Boolean,
  position: Number,
  permissions: String,
  memberIds: [String],
  icon: String,
});

const RoleBackup = mongoose.model("RoleBackup", roleBackupSchema);

module.exports = (client) => {
  // Update backup when bot starts
  client.once(Events.ClientReady, async () => {
    console.log("🤖 Bot is ready!");
    const guilds = client.guilds.cache;

    // Process guilds sequentially to avoid overwhelming Discord's API
    for (const guild of guilds.values()) {
      try {
        await updateRoleBackup(guild);
      } catch (error) {
        console.error(
          `❌ Error updating backup for guild ${guild.name}:`,
          error
        );
      }
    }
  });

  // Update backup when a new member joins
  client.on(Events.GuildMemberAdd, async (member) => {
    await updateRoleBackup(member.guild);
  });

  // Restore deleted role
  client.on(Events.GuildRoleDelete, async (role) => {
    console.log(`❌ Role deleted: ${role.name}`);
    await restoreDeletedRole(role.guild, role);
  });

  // Function to update role backup in MongoDB
  async function updateRoleBackup(guild) {
    try {
      console.log(`🔄 Updating role backup for server: ${guild.name}`);

      // Increase the timeout and fetch members with a larger timeout
      const members = await guild.members.fetch({
        force: true, // Force fetch even if already cached
        time: 120000, // Increase timeout to 120 seconds (2 minutes)
      });

      // Delete old records for this server
      await RoleBackup.deleteMany({ guildId: guild.id });

      // Prepare role data
      const rolesData = {};
      for (const [memberId, member] of members) {
        if (!member.user.bot) {
          for (const role of member.roles.cache.values()) {
            if (role.id !== guild.id) {
              if (!rolesData[role.id]) {
                rolesData[role.id] = {
                  guildId: guild.id,
                  roleId: role.id,
                  roleName: role.name,
                  color: role.color,
                  hoist: role.hoist,
                  position: role.position,
                  permissions: role.permissions.bitfield.toString(),
                  memberIds: [],
                  icon: role.icon || "",
                };
              }
              rolesData[role.id].memberIds.push(memberId);
            }
          }
        }
      }

      // Insert new data into database
      if (Object.keys(rolesData).length > 0) {
        await RoleBackup.insertMany(Object.values(rolesData));
        console.log(`✅ Role backup updated for server: ${guild.name}`);
      } else {
        console.log(`⚠️ No role data found for server: ${guild.name}`);
      }
    } catch (error) {
      console.error("❌ Error updating backup:", error);

      // Additional error handling for specific scenarios
      if (error.code === "GuildMembersTimeout") {
        console.error(
          "Timeout occurred while fetching members. Consider increasing timeout or processing in batches."
        );
      }
    }
  }

  // Function to restore a deleted role
  async function restoreDeletedRole(guild, deletedRole) {
    try {
      console.log(
        `🔄 Attempting to restore deleted role: ${deletedRole.name} (${deletedRole.id})`
      );

      // Try to find role by ID
      let roleData = await RoleBackup.findOne({
        guildId: guild.id,
        roleId: deletedRole.id,
      });

      // If not found, try to find by name
      if (!roleData) {
        console.log(`⚠️ Role not found by ID, searching by name...`);
        roleData = await RoleBackup.findOne({
          guildId: guild.id,
          roleName: deletedRole.name,
        });
      }

      // If still not found, stop the process
      if (!roleData) {
        console.log(`❌ No backup found for role "${deletedRole.name}".`);
        return;
      }

      // Convert icon ID to Discord CDN URL
      const roleIcon = roleData.icon
        ? `https://cdn.discordapp.com/role-icons/${roleData.roleId}/${roleData.icon}.png`
        : null;

      // Create the role
      const restoredRole = await guild.roles.create({
        name: roleData.roleName,
        color: roleData.color,
        hoist: roleData.hoist,
        position: roleData.position,
        permissions: BigInt(roleData.permissions),
        icon: roleIcon,
        reason: "Restoring deleted role from backup",
      });

      console.log(`✅ Role restored: ${restoredRole.name}`);

      // Reassign role to members
      const members = await guild.members.fetch();
      await Promise.all(
        roleData.memberIds.map(async (memberId) => {
          const member = members.get(memberId);
          if (member) {
            try {
              await member.roles.add(restoredRole);
              console.log(`✅ Role reassigned to member: ${member.user.tag}`);
            } catch (err) {
              console.error(
                `❌ Cannot add role to member ${member.user.tag}:`,
                err
              );
            }
          }
        })
      );

      console.log("✅ Role reassigned to members.");
    } catch (error) {
      console.error("❌ Error restoring role:", error);
    }
  }
};
