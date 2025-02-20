const { Client, Events, PermissionsBitField } = require("discord.js");
const mongoose = require("mongoose");

// مخطط قاعدة البيانات لحفظ بيانات القنوات
const channelBackupSchema = new mongoose.Schema({
  guildId: String,
  channelId: String,
  name: String,
  type: Number,
  position: Number,
  parentId: String,
  permissions: Object,
});

const ChannelBackup = mongoose.model("ChannelBackup", channelBackupSchema);

module.exports = (client) => {
  client.once(Events.ClientReady, async () => {
    console.log("🤖 البوت جاهز!");
    client.guilds.cache.forEach(async (guild) => {
      await updateChannelBackup(guild);
    });
  });

  client.on(Events.ChannelCreate, async (channel) => {
    await updateChannelBackup(channel.guild);
  });

  client.on(Events.ChannelDelete, async (channel) => {
    console.log(`❌ تم حذف القناة: ${channel.name}`);
    await checkAndRestoreChannel(channel.guild, channel);
  });

  async function updateChannelBackup(guild) {
    try {
      console.log(`🔄 تحديث نسخة القنوات الاحتياطية للسيرفر: ${guild.name}`);

      await ChannelBackup.deleteMany({ guildId: guild.id });

      const channels = guild.channels.cache;
      const channelData = channels.map((channel) => ({
        guildId: guild.id,
        channelId: channel.id,
        name: channel.name,
        type: channel.type,
        position: channel.position,
        parentId: channel.parentId || null,
        permissions: channel.permissionOverwrites.cache.map((perm) => ({
          id: perm.id,
          type: perm.type,
          allow: perm.allow.bitfield.toString(),
          deny: perm.deny.bitfield.toString(),
        })),
      }));

      await ChannelBackup.insertMany(channelData);

      console.log(`✅ تم تحديث نسخة القنوات الاحتياطية للسيرفر: ${guild.name}`);
    } catch (error) {
      console.error("❌ خطأ أثناء تحديث النسخة الاحتياطية:", error);
    }
  }

  async function checkAndRestoreChannel(guild, deletedChannel) {
    try {
      const auditLogs = await guild.fetchAuditLogs({ type: 12, limit: 1 });
      const logEntry = auditLogs.entries.first();

      if (!logEntry) {
        console.log("⚠️ لم يتم العثور على سجل الحذف.");
        return;
      }

      const { executor } = logEntry; // الشخص الذي حذف القناة
      const guildOwner = await guild.fetchOwner(); // جلب الـ Owner

      if (executor.id === guildOwner.id) {
        console.log(
          `🛑 القناة "${deletedChannel.name}" تم حذفها بواسطة الـ Owner، لن يتم استعادتها.`
        );
        return;
      }

      console.log(
        `🔄 القناة "${deletedChannel.name}" تم حذفها بواسطة ${executor.tag}، يتم استعادتها...`
      );
      await restoreDeletedChannel(guild, deletedChannel);
    } catch (error) {
      console.error("❌ خطأ أثناء التحقق من مسؤول الحذف:", error);
    }
  }

  async function restoreDeletedChannel(guild, deletedChannel) {
    try {
      let channelData = await ChannelBackup.findOne({
        guildId: guild.id,
        channelId: deletedChannel.id,
      });

      if (!channelData) {
        console.log(
          `⚠️ لم يتم العثور على القناة باستخدام ID، يتم البحث باستخدام الاسم...`
        );
        channelData = await ChannelBackup.findOne({
          guildId: guild.id,
          name: deletedChannel.name,
        });
      }

      if (!channelData) {
        console.log(
          `❌ لم يتم العثور على النسخة الاحتياطية للقناة "${deletedChannel.name}".`
        );
        return;
      }

      const newChannel = await guild.channels.create({
        name: channelData.name,
        type: channelData.type,
        position: channelData.position,
        parent: channelData.parentId
          ? guild.channels.cache.get(channelData.parentId)
          : null,
        reason: "إعادة القناة المحذوفة من النسخة الاحتياطية",
      });

      console.log(`✅ تم استعادة القناة: ${newChannel.name}`);

      for (const perm of channelData.permissions) {
        await newChannel.permissionOverwrites.create(perm.id, {
          Allow: new PermissionsBitField(perm.allow),
          Deny: new PermissionsBitField(perm.deny),
        });
      }

      console.log("✅ تم استعادة صلاحيات القناة.");
    } catch (error) {
      console.error("❌ خطأ أثناء استعادة القناة:", error);
    }
  }
};
