const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const fs = require("fs");

module.exports = (client) => {
  const voiceChannelId = "1339251067485032459";
  const staffChannelID = "1339251154298736813";
  const staffRoleID = "1229411562985492556";
  const audioFilePath = "./support.mp3";

  client.on("voiceStateUpdate", (oldState, newState) => {
    if (newState.member.user.bot) return;

    if (
      newState.channelId === voiceChannelId &&
      oldState.channelId !== voiceChannelId
    ) {
      const channel = newState.channel;
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });

      const player = createAudioPlayer();
      const resource = createAudioResource(fs.createReadStream(audioFilePath));
      player.play(resource);
      connection.subscribe(player);

      // يغادر القناة بعد انتهاء الصوت
      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

      // إرسال إشعار إلى روم الإدارة
      const staffChannel = newState.guild.channels.cache.get(staffChannelID);
      if (staffChannel) {
        staffChannel.send(`!شخص ما يحتاج مساعدة \n<@&${staffRoleID}>`);
      } else {
        console.log("❌ ايدي روم الإدارة غير صحيح أو غير موجود");
      }
    }
  });
};
