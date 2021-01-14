const fs = require('fs');
const simpleGit = require('simple-git');
const git = simpleGit('../monkeytype');
const beautify = require("json-beautify");
const stringSimilarity = require("string-similarity");

module.exports.run = async (bot, message, args, db, guild) => {
    console.log(`Running command ${this.cmd.name}`);
  
  
    try {

      async function forcePush(neww, quoteFile, newQuote, questionMessageContent, questionMessage){
        if(!neww){
          quoteFile.quotes.push(newQuote);
          fs.writeFileSync(fileDir,JSON.stringify(quoteFile));
          returnMessage = `Added quote to ${messageContent[2]}.json.`;
        }
        
        questionMessageContent[0] = `:thinking: Pulling latest changes from upstream...`;
        questionMessage.edit(questionMessageContent.join(''));
        await git.pull('upstream','master');
        questionMessageContent[0] = `:thinking: Staging ${messageContent[2]}.json...`;
        questionMessage.edit(questionMessageContent.join(''));
        await git.add([`static/quotes/${messageContent[2]}.json`]);
        questionMessageContent[0] = `:thinking: Committing...`;
        questionMessage.edit(questionMessageContent.join(''));
        await git.commit(`Added quote to ${messageContent[2]}.json`);
        questionMessageContent[0] = `:thinking: Pushing to origin...`;
        questionMessage.edit(questionMessageContent.join(''));
        await git.push('origin','master');
  
        questionMessageContent[0] = `:white_check_mark: ${returnMessage}`;
        questionMessage.edit(questionMessageContent.join(''));
  
      }
      
      let showtimeout = true;

        let messageContent = await message.channel.messages.fetch(args[0]);
        messageContent = messageContent.content.split('\n');

        messageContent[2] = messageContent[2].toLowerCase();

        var specials = {
          "“": '"', // &ldquo;	&#8220;
          "”": '"', // &rdquo;	&#8221;
          "’": "'", // &lsquo;	&#8216;
          "‘": "'", // &rsquo;	&#8217;
          ",": ",", // &sbquo;	&#8218;
          "—": "-", // &mdash;  &#8212;
          "…": "...", // &hellip; &#8230;
          "«": "<<",
          "»": ">>",
          "–": "-",
        };
        messageContent[0] = messageContent[0].replace(/[“”’‘—,…«»–]/g, (char) => specials[char] || "");
        
        let newQuote = {
          text: messageContent[0],
          source: messageContent[1],
          length: messageContent[0].length
        }

        let quoteFile;

        let questionMessageContent = [
          `:question: I'm about to add this quote to the **${messageContent[2]}** file. Is this correct?`,
          `\`\`\`json\n${JSON.stringify(newQuote,null,2)}\`\`\``
        ];

        const fileDir = `../monkeytype/static/quotes/${messageContent[2]}.json`;


        let questionMessage = await message.channel.send(questionMessageContent.join(''));
        await questionMessage.react("✅");
        await questionMessage.react("❌");
        showtimeout = true;
        
        const filter = (reaction, user) =>
            (reaction.emoji.name === "✅" || reaction.emoji.name === "❌" || reaction.emoji.name === "🔨") && user.id === message.author.id;

        let collector = questionMessage.createReactionCollector(filter, {
            max: 2,
            time: 5000
        })
        
        collector.on('end', async r => {
          questionMessage.reactions.removeAll();
          if(showtimeout){
            questionMessageContent[0] = `:x: Reaction timeout`;
            questionMessage.edit(questionMessageContent.join(''));
            return;
          }
        })

        collector.on('collect', async r => {
          questionMessage.reactions.removeAll();

          if(r.emoji.name === "✅"){
            showtimeout = false;

            let returnMessage = "";

            questionMessageContent[0] = `:thinking: Looking for ${messageContent[2]}.json...`;
            questionMessage.edit(questionMessageContent.join(''));
            
            try{
              if (fs.existsSync(fileDir)) {
                  questionMessageContent[0] = `:thinking: File exists. Adding quote...`;
                  questionMessage.edit(questionMessageContent.join(''));
                  quoteFile = fs.readFileSync(fileDir);
                  quoteFile = JSON.parse(quoteFile.toString());
                  let newid = Math.max.apply(Math, quoteFile.quotes.map(function(q) { return q.id; })) + 1;
                  newQuote.id = newid;

                  //check for similarity
                  let highestsimilarity = 0;
                  let highestquote;
                  quoteFile.quotes.forEach(quote => {
                    let sim = stringSimilarity.compareTwoStrings(newQuote.text, quote.text);
                    if(sim > highestsimilarity){
                      highestsimilarity = sim;
                      highestquote = quote;
                    }
                  });

                  if(highestsimilarity >= 0.5){
                    questionMessageContent[0] = `:grimacing: Found a similar quote (${highestsimilarity}). React with 🔨 to add anyway.`;
                    questionMessage.edit(questionMessageContent.join('') + "Similar quote:" + `\`\`\`json\n${JSON.stringify(highestquote,null,2)}\`\`\``);
                    await questionMessage.react("🔨");
                    await questionMessage.react("❌");
                    showtimeout = true;
                    return;
                  }else{
                    await forcePush(false, quoteFile, newQuote, questionMessageContent, questionMessage);
                  }
              } else {
                  //file doesnt exist, create it
                  questionMessageContent[0] = `:thinking: File not found. Creating...`;
                  questionMessage.edit(questionMessageContent.join(''));
                  newQuote.id = 1;
                  fs.writeFileSync(fileDir, JSON.stringify({
                      "language": messageContent[2],
                      "groups": [
                          [0, 100],
                          [101, 300],
                          [301, 600],
                          [601, 9999]
                      ],
                      "quotes": [newQuote]
                  })
                  );
                  returnMessage = `Created file ${messageContent[2]}.json and added quote.`
                  await forcePush(true, quoteFile, newQuote, questionMessageContent, questionMessage);
              }
            }catch(e){
              console.error(e);
              questionMessage.edit(':x: Something went wrong while editing the file: ' + e);
            }

          }else if(r.emoji.name === "❌"){
            showtimeout = false;
            collector.stop();
            questionMessageContent[0] = `:x: Canceled`;
            questionMessage.edit(questionMessageContent.join(''));
          }else if(r.emoji.name === "🔨"){
            showtimeout = false;
            collector.stop();
            forcePush(false, quoteFile, newQuote, questionMessageContent, questionMessage);
          }
        });
    } catch (e) {
      console.error(e);
      return {
        status: false,
        message: ":x: Could not add quote: " + e.message,
      };
    }
  };
  
  module.exports.cmd = {
    name: "quote_add",
    needMod: true,
  };
  