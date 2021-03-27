const Discord = require("discord.js");
const config = require("./config.json");
const request = require('request');

const client = new Discord.Client();
const MessageEmbed = Discord.MessageEmbed;

const prefix = config.PREFIX;
let lastProgramming = '';    
let lastTarkov = '';

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);    
    // Send timed messages
    getPosts(config.CHANNEL_ONE_SR, config.CHANNEL_ONE_ID);
    getPosts(config.CHANNEL_TWO_SR, config.CHANNEL_TWO_ID);
});

// Loop for latest posts
function getPosts(subreddit, channel) {    
    setTimeout(async () => {
        let msg = await getPost(subreddit);
        if (msg.url === lastProgramming || msg.url === lastTarkov) { 
            console.log(`Nothing new for /r/` + subreddit);
        } else {
            console.log(`Eyyyy something new for /r/` + subreddit);
            client.channels.cache.get(channel).send(msg);            
            if (subreddit === 'programming') {
                lastProgramming = msg.url;
            } else if (subreddit === 'EscapefromTarkov') {
                lastTarkov = msg.url;
            }
        }
        getPosts(subreddit, channel);
    }, config.POST_TIMEOUT_MS);   
}

// Get reddit post and construct message
function getPost(subreddit) {
    return new Promise((resolve, reject) => {
        request.get('https://www.reddit.com/r/'+subreddit+'/top.json?limit=1', function (error, res, body) {
            if (error) {
                console.error('error:', error); // Print the error if one occurred
                reject(error);
            } else {   
                let resJSON = JSON.parse(res.body);
                if (resJSON.data.children.length != 0) {
                    const embed = new MessageEmbed()           
                    // Set the title of the field
                    .setTitle(resJSON.data.children[0].data.title)
                    // Set subreddit
                    .setAuthor('/r/' + resJSON.data.children[0].data.subreddit)
                    // Set the color of the embed
                    .setColor(0x42f5b3)
                    // Set the main content of the embed
                    .setDescription(`**Author**: \n` + resJSON.data.children[0].data.author)
                    // Send the embed to the same channel as the message
                    .setURL('https://reddit.com' + resJSON.data.children[0].data.permalink)            
                    .setImage(resJSON.data.children[0].data.media != null && resJSON.data.children[0].data.media.oembed != undefined ? resJSON.data.children[0].data.media.oembed.thumbnail_url : '')
                    resolve(embed);
                } else {
                    resolve(`Couldn't find that subreddit`);
                }        
            }            
        });
    })    
}

// Bot responses
client.on("message", async function(message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  
  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();

  if (command === "ask") { 
    let response
    // const timeTaken = Date.now() - message.createdTimestamp; // time taken
    request.get(config.API + '/api/bot?msg=' + args.join(' '), function (error, res, body) {
        if (error) {
            console.error('error:', error); // Print the error if one occurred
            message.reply(`Something went wrong`);
        } else {    
            let resJSON = JSON.parse(res.body);                   
            if (resJSON.msg.output.generic[0] != undefined) {
                if (resJSON.msg.output.intents[0].confidence >= 0.7 || resJSON.msg.output.intents[0].intent === "Math") {
                  response = resJSON.msg.output.generic[0].text;
                } else {                  
                  response = 'I\'m only ' + Math.round(resJSON.msg.output.intents[0].confidence * 100).toString() + '% sure I know the answer to that so I\'m going to assume I\'m wrong and rather ask you to ask me something else';
                }
            } else {
                response = 'I don\'t understand, sorry, I\'m still learning, please try asking me something else';
            }
            message.reply(response);  
            console.log(JSON.parse(res.body).msg.output.generic[0].text)
        }
        console.log('statusCode:', res && res.statusCode); // Print the response status code if a response was received       
    });    
  } else if (command === "reddit") {
    if (args.length > 0) {
        let msg = await getPost(args[0]);
        message.reply(msg);
    } else {
        message.reply(`You need to supply a subreddit`);
    }    
  }
}); 

client.login(config.BOT_TOKEN);

console.log("to the moon");