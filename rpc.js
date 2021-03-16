const RPC = require("discord-rpc");
const rpc = new RPC.Client({
  transport: "ipc"
});

rpc.on("ready", () => {
  rpc.setActivity({
    details: "SERVER LISTING IS OUT!",
    state: "https://urlcord.cf/list/server",
    startTimestamp: new Date(),
    largeImageIcon: ""
  })
})