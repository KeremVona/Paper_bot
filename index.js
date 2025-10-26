import Discord from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
  ],
});

client.login(process.env.TOKEN);

client.on("clientReady", () => {
  console.log("READY!");
});

client.on("messageCreate", gotMessage);

function gotMessage(msg) {
  if (msg.author.bot) {
    return;
  }
  if (msg.content === "paper") {
    msg.reply("Hey! I am paper bot");
  }
}
