module.exports.run = async (bot, message, args, db, guild) => {
  console.log(`Running command ${this.cmd.name}`);
  const { exec } = require("child_process");

  try {
    message.channel.send(`Upgrading...`);
    exec("~/monkey-bot/upgrade.sh", (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return {
          status: false,
          message: "Could not upgrade: " + error.message,
        };
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return {
          status: false,
          message: "Could not upgrade: " + error.message,
        };
      }
      console.log(`stdout: ${stdout}`);
    });
    return {
      status: true,
      message: "Upgrading?"
    }
  } catch (e) {
    return {
      status: false,
      message: "Could not upgrade: " + e.message,
    };
  }
};

module.exports.cmd = {
  name: "upgrade",
  needMod: true,
};