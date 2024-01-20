const { Client, Partials, Collection, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js')
const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
      Partials.Channel,
      Partials.Message,
      Partials.User,
      Partials.GuildMember,
      Partials.Reaction
    ]});
const db = require('./msg');
const fs = require('fs')
const query = `
  SELECT msgs, bi_msgs
  FROM users
  WHERE id = ?
`;
const vquery = `
  SELECT total_voice, bi_voice
  FROM users
  WHERE id = ?
`;
const voiceSessions = new Map();

function addtolog(info) {
    fs.appendFile(currentlog, info + "\n", function (err) {
        if (err) throw err
    })
}

client.on('ready', async () => 
{
    //makes timestamp
    currentTime = new Date()
    timestamp = currentTime.getFullYear() + "-" + (currentTime.getMonth() + 1) + "-" + currentTime.getDate() + "-" + currentTime.getHours()+ "-" + currentTime.getMinutes() + "-" + currentTime.getSeconds()
    console.log(timestamp)
    currentlog = './logs/' + timestamp + '.txt'
    fs.writeFile(currentlog, "Today's Report!\n" , function (err) {
        if (err) throw err
        console.log('I am online.)')
    })

    //login
    console.log("Connected as " + client.user.tag)

    // List servers the bot is connected to
    console.log("Servers:")

    client.guilds.cache.forEach((guild) => {
        addtolog(" - " + guild.name)
        console.log(" - " + guild.name)

        // List all channels
        guild.channels.cache.forEach((channel) => {
            console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
            addtolog(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
        })
    })
})

function secondsToDHMS(seconds) {
  // Calculate days, hours, minutes, and remaining seconds
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  // Create a string representation with colons, excluding parts that are zero
  const resultArray = [];
  
  if (days > 0) {
    resultArray.push(`D: ${days}, `);
  }

  if (hours > 0 || days > 0) {
    resultArray.push(`H: ${hours}, `);
  }

  if (minutes > 0 || hours > 0 || days > 0) {
    resultArray.push(`M: ${minutes}, `);
  }

  resultArray.push(`S: ${remainingSeconds}`);

  const result = resultArray.join(' ');

  return result;
}

function countUserMessages(guild, userId, currentDate) {
  let messageCount = 0;
  let biCount = 0;

  return guild.channels
    .fetch()
    .then((channels) => {
      const promises = [];

      channels.forEach((channel) => {
        if (channel.type === 0 || channel.type === 11) {
          promises.push(
            channel.messages
              .fetch({ limit: 100 })
              .then((messages) => {
                messages.forEach((message) => {
                  if (message.author.id === userId) {
                    messageCount++;
                    if (currentDate - message.createdAt <= 1209600000) {
                      biCount++;
                    }
                  }
                });
              })
          );
        }
      });

      return Promise.all(promises);
    })
    .then(() => [messageCount, biCount])
    .catch((error) => {
      console.error('Error fetching channels or messages:', error.message);
      return [0, 0];
    });
}


client.on('messageCreate', async (receivedMessage) => {
  const updateQuery = `
    UPDATE users
    SET msgs = msgs + 1,
        bi_msgs = bi_msgs + 1
    WHERE id = ?;
    `;

    db.run(updateQuery, [receivedMessage.author.id.concat("+", receivedMessage.guild.id)], function (err) {
      if (err) {
          console.error(err.message);
      } else {
          console.log(`Rows updated: ${this.changes}`);
      }
    });
if (receivedMessage.content.substring(0, 6) == "scarlet" || receivedMessage.content.substring(0, 2) == "s!") {
    if (receivedMessage.content.substring(0, 6) == "scarlet") {
        var fullCommand = receivedMessage.content.substring(7) // Remove the "scarlet "
    } else {
        var fullCommand = receivedMessage.content.substring(2)
    }
    let splitCommand = fullCommand.split(" ") // Split the message up in to pieces for each space
    let primaryCommand = splitCommand[0] // The first word directly after the exclamation is the command
    let arguments = splitCommand.slice(1) // All other words are arguments/parameters/options for the command

    console.log("Command received: " + primaryCommand)
    console.log("Arguments: " + arguments) // There may not be any arguments
    var opts = receivedMessage;
    var currentTime = new Date()

    if (primaryCommand == "init" && receivedMessage.author.id == '221454409257713664') {
      client.guilds.cache.forEach((guild) => {

          // List all channels
          guild.members.fetch().then((members) => {
              members.forEach((member) => {
                    db.run(
                      'INSERT OR REPLACE INTO users (id, user_id, guild_id, username, msgs, bi_msgs, total_voice, bi_voice) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                      [
                        member.id.concat("+", guild.id),
                        member.id,
                        guild.id,
                        member.user.username,
                        0,
                        0,
                        0.0,
                        0.0
                      ],
                      (err) => {
                        if (err) {
                          console.error(err.message);
                        } else {
                          console.log('User registered successfully.');
                        }
                  })
                  })
          })
      })
  } else if (primaryCommand == "msg") {
    let person = receivedMessage.mentions.users.first();
    if (person) {
      db.get(query, [person.id.concat("+", receivedMessage.guild.id)], (err, row) => {
            if (err) {
                console.error(err.message);
            return;
        }
    
            if (row) {
                console.log(`Messages for ${person.id} in ${receivedMessage.guild.id}: ${row.msgs}`);
                return receivedMessage.reply(`${person.username} has sent ${row.msgs} total msgs.`)
            } else {
                console.log(`No record found for ${person.id} in ${receivedMessage.guild.id}`);
            }
        });
    } else {
      db.get(query, [receivedMessage.author.id.concat("+", receivedMessage.guild.id)], (err, row) => {
            if (err) {
                console.error(err.message);
            return;
        }
    
            if (row) {
                console.log(`Messages for ${receivedMessage.author.id} in ${receivedMessage.guild.id}: ${row.msgs}`);
                return receivedMessage.reply(`${receivedMessage.author.username} has sent ${row.msgs} total msgs.`)
            } else {
                console.log(`No record found for ${receivedMessage.author.id} in ${receivedMessage.guild.id}`);
            }
        });
    }
  } else if (primaryCommand == "vc") {
    let person = receivedMessage.mentions.users.first();
    if (person) {
      db.get(vquery, [person.id.concat("+", receivedMessage.guild.id)], (err, row) => {
        if (err) {
            console.error(err.message);
        return;
    }
  
        if (row) {
            console.log(`VC for ${person.id} in ${receivedMessage.guild.id}: ${row.total_voice}`);
            time = secondsToDHMS(row.total_voice);
            return receivedMessage.reply(`${person.username} has spent ${time} in VC.`)
        } else {
            console.log(`No record found for ${person.id} in ${receivedMessage.guild.id}`);
        }
    });
    } else {
      db.get(vquery, [receivedMessage.author.id.concat("+", receivedMessage.guild.id)], (err, row) => {
        if (err) {
            console.error(err.message);
        return;
    }
  
        if (row) {
            console.log(`VC for ${receivedMessage.author.id} in ${receivedMessage.guild.id}: ${row.total_voice}`);
            time = secondsToDHMS(row.total_voice);
            return receivedMessage.reply(`${receivedMessage.author.username} has spent ${time} in VC.`)
        } else {
            console.log(`No record found for ${receivedMessage.author.id} in ${receivedMessage.guild.id}`);
        }
    });
    }
  } else if (primaryCommand == "msgr") {
    let person = receivedMessage.mentions.users.first();
    return rankMessages(receivedMessage.guild.id, person, receivedMessage);
  } else if (primaryCommand == "vcr") {
    let person = receivedMessage.mentions.users.first();
    return rankVC(receivedMessage.guild.id, person, receivedMessage);
  } else if (primaryCommand == "bmsgr") {
    let person = receivedMessage.mentions.users.first();
    return brankMessages(receivedMessage.guild.id, person, receivedMessage)
  } else if (primaryCommand == "bvcr") {
    let person = receivedMessage.mentions.users.first();
    return brankVC(receivedMessage.guild.id, person, receivedMessage);
  } else if (primaryCommand == "bmsg") {
    let person = receivedMessage.mentions.users.first();
    if (person) {
      db.get(query, [person.id.concat("+", receivedMessage.guild.id)], (err, row) => {
            if (err) {
                console.error(err.message);
            return;
        }
    
            if (row) {
                console.log(`Messages for ${person.id} in ${receivedMessage.guild.id}: ${row.bi_msgs}`);
                return receivedMessage.reply(`${person.username} has sent ${row.bi_msgs} msgs recently.`)
            } else {
                console.log(`No record found for ${person.id} in ${receivedMessage.guild.id}`);
            }
        });
    } else {
      db.get(query, [receivedMessage.author.id.concat("+", receivedMessage.guild.id)], (err, row) => {
            if (err) {
                console.error(err.message);
            return;
        }
    
            if (row) {
                console.log(`Messages for ${receivedMessage.author.id} in ${receivedMessage.guild.id}: ${row.bi_msgs}`);
                return receivedMessage.reply(`${receivedMessage.author.username} has sent ${row.bi_msgs} msgs recently.`)
            } else {
                console.log(`No record found for ${receivedMessage.author.id} in ${receivedMessage.guild.id}`);
            }
        });
    }
  } else if (primaryCommand == "bvc") {
    let person = receivedMessage.mentions.users.first();
    if (person) {
      db.get(vquery, [person.id.concat("+", receivedMessage.guild.id)], (err, row) => {
        if (err) {
            console.error(err.message);
        return;
    }
  
        if (row) {
            console.log(`VC for ${person.id} in ${receivedMessage.guild.id}: ${row.bi_voice}`);
            time = secondsToDHMS(row.bi_voice);
            return receivedMessage.reply(`${person.username} has spent ${time} in VC recently.`)
        } else {
            console.log(`No record found for ${person.id} in ${receivedMessage.guild.id}`);
        }
    });
    } else {
      db.get(vquery, [receivedMessage.author.id.concat("+", receivedMessage.guild.id)], (err, row) => {
        if (err) {
            console.error(err.message);
        return;
    }
  
        if (row) {
            console.log(`VC for ${receivedMessage.author.id} in ${receivedMessage.guild.id}: ${row.bi_voice}`);
            time = secondsToDHMS(row.bi_voice);
            return receivedMessage.reply(`${receivedMessage.author.username} has spent ${time} in VC recently.`)
        } else {
            console.log(`No record found for ${receivedMessage.author.id} in ${receivedMessage.guild.id}`);
        }
    });
    }
  } else if (primaryCommand == "activityscore") {
    // overall activity ranking
    // text + vc
    db.get(vquery, [receivedMessage.author.id.concat("+", receivedMessage.guild.id)], (err, row) => {
      if (err) {
          console.error(err.message);
      return;
  }
      if (row) {
          time = secondsToDHMS(row.total_voice);
          db.get(query, [receivedMessage.author.id.concat("+", receivedMessage.guild.id)], (err, row) => {
            if (err) {
                console.error(err.message);
            return;
        }
            if (row) {
              // normalize vctime vs messages for proportional rankings
              //  in terms of activity, spending time in VC is worth more than messages in chat
              const vctime = time
              const proportional_msgcount = row.msgs / 10;
              const normalized_score = vctime + proportional_msgcount;

              console.log(`Normalized score for ${receivedMessage.author.id} in ${receivedMessage.guild.id}: ${normalized_score}`);
              return receivedMessage.reply(`${receivedMessage.author.username} has a score of ${normalized_score}`)

             } else {
                console.log(`No record found for ${receivedMessage.author.id} in ${receivedMessage.guild.id}`);
            }
        });
      
      } else {
          console.log(`No record found for ${receivedMessage.author.id} in ${receivedMessage.guild.id}`);
      }
  });

  }
   
}
});

function truncateString(str, char, limit) {
  const parts = str.split(char);
  const truncated = parts.slice(0, limit).join(char);
  return truncated;
}

client.on('voiceStateUpdate', (oldState, newState) => {
  if (oldState.channelId !== newState.channelId) {
    const userId = newState.id;
    const guildId = newState.guild.id;

    if (newState.channel) {
      voiceSessions.set(`${userId}-${guildId}`, Date.now());
    } else {
      const sessionKey = `${userId}-${guildId}`;
      const startTime = voiceSessions.get(sessionKey);

      if (startTime) {
        const endTime = Date.now();
        const durationInSeconds = Math.floor((endTime - startTime) / 1000);

        updateVoiceTime(userId, guildId, durationInSeconds);

        voiceSessions.delete(sessionKey);

        console.log(`User ${userId} spent ${durationInSeconds} seconds in voice channel.`);
      }
    }
  }
});

function updateVoiceTime(userId, guildId, durationInSeconds) {
  db.get(vquery, [userId.concat("+", guildId)], (err, row) => {
    if (err) {
        console.error(err.message);
    return;
  }
  const updateQuery = `
    UPDATE users
    SET total_voice = ?,
        bi_voice = ?
    WHERE id = ?;
    `;
  let t, bt;
  if (row.total_voice) {
    t = row.total_voice + durationInSeconds
  } else {
    t = durationInSeconds;
  }
  if (row.bi_voice) {
    bt = row.bi_voice + durationInSeconds
  } else {
    bt = durationInSeconds;
  }
  db.run(updateQuery, [t, bt, userId.concat("+", guildId)], function (err) {
    if (err) {
        console.error(err.message);
    } else {
        console.log(`Rows updated: ${this.changes}`);
    }
  });
})
}

client.on('guildMemberAdd', (member) => {

  const insertQuery = `
    INSERT INTO users (id, user_id, guild_id, username, msgs, bi_msgs, total_voice, bi_voice)
    VALUES (?, ?, ?, ?, 0, 0, 0.0, 0.0)
  `;

  db.run(insertQuery, [member.user.id.concat("+",member.guild.id), member.user.id, member.guild.id, member.user.username], (err) => {
    if (err) {
      console.error(`Error adding new user: ${err.message}`);
    } else {
      console.log(`New user ${member.user.username} joined the server. Entry added to the database.`);
    }
  });
});

client.on('guildCreate', (guild) => {

  guild.members.fetch().then((members) => {
    members.forEach((member) => {
      const insertQuery = `
        INSERT INTO users (id, user_id, guild_id, username, msgs, bi_msgs, total_voice, bi_voice)
        VALUES (?, ?, ?, ?, 0, 0, 0.0, 0.0)
      `;

      db.run(insertQuery, [member.user.id.concat("+",member.guild.id), member.user.id, member.guild.id, member.user.username], (err) => {
        if (err) {
          console.error(`Error adding new user: ${err.message}`);
        } else {
          console.log(`New user ${member.user.username} added to the database.`);
        }
      });
    });
  });
});

async function rankMessages(guildId, person, receivedMessage) {
  try {
    const selectQuery = `
      SELECT username, msgs, user_id
      FROM users
      WHERE guild_id = ?
      ORDER BY msgs DESC;
    `;

    await db.all(selectQuery, [guildId], (err, rows) => {
      if (rows.length > 0) {
        console.log(`Ranking for Guild ${guildId}:`);
        var response = ""
        rows.forEach((row, index) => {
          console.log(`${index + 1}. ${row.username} - ${row.msgs} messages`);
          if (person && person.id == row.user_id) {
            return receivedMessage.reply(`${person.username} is #${index + 1} in message rankings.`);
          } else if (person == undefined) {
            response += "`" + (index + 1) + ".` " + `${row.username} - ${row.msgs} messages` + "\n"
          }
        });
        if (response == "") {
          return
        } else {
          tresponse = truncateString(response, '\n', 10);
      const rankList = new EmbedBuilder()
                        .setColor('#FF2400')
                        .setAuthor({
                            name: receivedMessage.guild.name + " Message Rankings:", 
                            iconURL: receivedMessage.author.avatarURL()})
                        .addFields(
                    { name: 'Top 10:', value: tresponse},
                    )
                        .setTimestamp()
                        .setFooter({
                            text: client.user.username + ' Bot', 
                            iconURL: client.user.avatarURL()});
                   console.log(`Ranks was shown!`)
                   return receivedMessage.reply({embeds: [rankList]});
        }
      } else {
        console.log(`No data found for Guild ${guildId}.`);
      }
    })

  } catch (error) {
    console.error(`Error ranking messages: ${error.message}`);
  }
}

async function brankMessages(guildId, person, receivedMessage) {
  try {
    const selectQuery = `
      SELECT username, bi_msgs, user_id
      FROM users
      WHERE guild_id = ?
      ORDER BY bi_msgs DESC;
    `;

    await db.all(selectQuery, [guildId], (err, rows) => {
      if (rows.length > 0) {
        console.log(`Ranking for Guild ${guildId}:`);
        var response = ""
        rows.forEach((row, index) => {
          console.log(`${index + 1}. ${row.username} - ${row.bi_msgs} messages`);
          if (person && person.id == row.user_id) {
            return receivedMessage.reply(`${person.username} is #${index + 1} in message rankings.`);
          } else if (person == undefined) {
            response += "`" + (index + 1) + ".` " + `${row.username} - ${row.bi_msgs} messages` + "\n"
          }
        });
        if (response == "") {
          return
        } else {
          tresponse = truncateString(response, '\n', 10);
      const rankList = new EmbedBuilder()
                        .setColor('#FF2400')
                        .setAuthor({
                            name: receivedMessage.guild.name + " Biweekly Message Rankings:", 
                            iconURL: receivedMessage.author.avatarURL()})
                        .addFields(
                    { name: 'Top 10:', value: tresponse},
                    )
                        .setTimestamp()
                        .setFooter({
                            text: client.user.username + ' Bot', 
                            iconURL: client.user.avatarURL()});
                   console.log(`Ranks was shown!`)
                   return receivedMessage.reply({embeds: [rankList]});
        }
      } else {
        console.log(`No data found for Guild ${guildId}.`);
      }
    })

  } catch (error) {
    console.error(`Error ranking messages: ${error.message}`);
  }
}

async function rankVC(guildId, person, receivedMessage) {
  try {
    const selectQuery = `
      SELECT username, total_voice, user_id
      FROM users
      WHERE guild_id = ?
      ORDER BY total_voice DESC;
    `;

    await db.all(selectQuery, [guildId], (err, rows) => {
      if (rows.length > 0) {
        console.log(`Ranking for Guild ${guildId}:`);
        var response = ""
        rows.forEach((row, index) => {
          if (person && person.id == row.user_id) {
            return receivedMessage.reply(`${person.username} is #${index + 1} in VC rankings.`);
          } else if (person == undefined) {
            time = secondsToDHMS(row.total_voice);
            response += "`" + (index + 1) + ".` " + `${row.username} - ${time}` + "\n"
          }
        });
        if (response == "") {
          return
        } else {
          tresponse = truncateString(response, '\n', 10);
      const rankList = new EmbedBuilder()
                        .setColor('#FF2400')
                        .setAuthor({
                            name: receivedMessage.guild.name + " VC Rankings:", 
                            iconURL: receivedMessage.author.avatarURL()})
                        .addFields(
                    { name: 'Top 10:', value: tresponse},
                    )
                        .setTimestamp()
                        .setFooter({
                            text: client.user.username + ' Bot', 
                            iconURL: client.user.avatarURL()});
                   console.log(`Ranks was shown!`)
                   return receivedMessage.reply({embeds: [rankList]});
        }
      } else {
        console.log(`No data found for Guild ${guildId}.`);
      }
    })

  } catch (error) {
    console.error(`Error ranking messages: ${error.message}`);
  }
}

async function brankVC(guildId, person, receivedMessage) {
  try {
    const selectQuery = `
      SELECT username, bi_voice, user_id
      FROM users
      WHERE guild_id = ?
      ORDER BY bi_voice DESC;
    `;

    await db.all(selectQuery, [guildId], (err, rows) => {
      if (rows.length > 0) {
        console.log(`Ranking for Guild ${guildId}:`);
        var response = ""
        rows.forEach((row, index) => {
          if (person && person.id == row.user_id) {
            return receivedMessage.reply(`${person.username} is #${index + 1} in VC rankings.`);
          } else if (person == undefined) {
            time = secondsToDHMS(row.bi_voice);
            response += "`" + (index + 1) + ".` " + `${row.username} - ${time}` + "\n"
          }
        });
        if (response == "") {
          return
        } else {
          tresponse = truncateString(response, '\n', 10);
      const rankList = new EmbedBuilder()
                        .setColor('#FF2400')
                        .setAuthor({
                            name: receivedMessage.guild.name + " Biweekly VC Rankings:", 
                            iconURL: receivedMessage.author.avatarURL()})
                        .addFields(
                    { name: 'Top 10:', value: tresponse},
                    )
                        .setTimestamp()
                        .setFooter({
                            text: client.user.username + ' Bot', 
                            iconURL: client.user.avatarURL()});
                   console.log(`Ranks was shown!`)
                   return receivedMessage.reply({embeds: [rankList]});
        }
      } else {
        console.log(`No data found for Guild ${guildId}.`);
      }
    })

  } catch (error) {
    console.error(`Error ranking messages: ${error.message}`);
  }
}

process.on('beforeExit', () => {
  console.log('Closing the database connection...');
  
  db.close((err) => {
    if (err) {
      console.error('Error closing the database connection:', err.message);
    } else {
      console.log('Database connection closed successfully.');
    }
  });
});

process.on('exit', (code) => {
  console.log(`Process is exiting with code: ${code}`);
  
  db.close((err) => {
    if (err) {
      console.error('Error closing the database connection:', err.message);
    } else {
      console.log('Database connection closed successfully.');
    }
  });
});

bot_secret_token;

client.login(bot_secret_token)