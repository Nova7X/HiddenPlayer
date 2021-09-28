// HiddePlayer GPL-3.0 License
// Modules
const InternalVersion = require('./scripts/version');

const Fs = require('fs');
const Utility = require('./scripts/util');
const FileConfig = require('./scripts/config');
const FileLanguange = require('./scripts/language');
const FileResponse = require('./scripts/response');

const prompt = require('prompt-sync')();

const Discord = require('discord.js');

const Mineflayer = require('mineflayer');
const MineflayerCmd = require('mineflayer-cmd').plugin;
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const PvpBot = require('mineflayer-pvp').plugin;

const Startup = require('./scripts/startup')();


// Assemly
const util = new Utility();
const parseConfig = new FileConfig();
const parseLanguage = new FileLanguange();
const parseResponse = new FileResponse();
const Logger = require('./scripts/logger');
const { rejects } = require('assert');

parseConfig.location = './config/config.yml';
parseLanguage.location = './config/language.yml';
parseResponse.location = './config/response.yml';
const log = new Logger();
let language = {};
let response = {};
let config = prefillConfig(parseConfig.parse());


// Core Process
var mcLoggedIn = false;
newBot(config.player.name, config.server.ip, config.server.port, config.player.version);

// Core Functions
function prefillConfig(config){

    if(config.player.enabled){
        switch (true){
            case (config.server.ip == null):
                config.server.ip = prompt("Enter Server IP (no port): ");
            case (config.server.port == null):
                config.server.port = prompt("Enter Server Port: ");
            case (config.player.name == null):
                config.player.name = prompt("Enter Player Name: ");
            case (config.player.message == null):
                config.player.message = prompt("Enter onLogin message: ");
        }

        if(config.server.ip == null || config.server.ip == '') throw new Error("Invalid Server IP: " + config.server.ip);
        if(!util.isNumber(config.server.port) || config.server.port < 1 || config.server.port > 65535) throw new Error("Invalid Server Port: " + config.server.port);
        if(config.player.name == '' || typeof config.player.name !== 'string') throw new Error("Invalid Player Name: " + config.player.name);
    }

    response = parseResponse.parse();
    language = parseLanguage.parse();

    return util.testMode(config);
}

function newBot(playerName = 'HiddenPlayer', serverIp = '127.0.0.1', serverPort = 25565, serverVersion = null){
    
    const mcLog = new Logger();
        mcLog.defaultPrefix = 'Minecraft';
    
    mcLog.log("Creating new bot");

    // Movements
    const actions = ['forward', 'back', 'left', 'right'];
    var lasttime = -1;
    var moveinterval = 5;
    var maxrandom = 5;
    var moving = false;
    var jump = true;
    var onPVP = false;
    var lastaction = null;

    // Entities
    let entity = null;

    // Connection
    switch (true){
        case (mcLoggedIn):
            mcLog.warn("Player already connected to a server");
            return;
        case (!config.player.enabled):
            mcLog.warn("Player Disabled");
            return;
    }

    mcLog.log(playerName + " is ready to connect!");

    const validateCreds = new validateCredentials();
    serverIp = validateCreds.host(serverIp);
    serverPort = validateCreds.port(serverPort);

    // Bot core
    const connection = {
        host: serverIp,
        port: serverPort,
        username: playerName,
        version: serverVersion
    };

    mcLog.log('Connecting...');
    mcLog.log(connection);
    let bot = Mineflayer.createBot(connection);

    bot.loadPlugin(MineflayerCmd);
    bot.loadPlugin(pathfinder);
    bot.loadPlugin(PvpBot);

    mcLoggedIn = true;
    let firstSpawn = false;

    bot.on('kicked', (reason) => {
        mcLog.warn(playerName + " left the game: " + reason)
        endBot();
    });
    bot.on('error', (reason) => {
        mcLog.error(playerName + " left the game: " + reason)
        endBot();
    });

    bot.on('end', () => {
        mcLog.warn(playerName + " Ended!");
        reConnect();
    });
    bot.on('spawn', async () => {
        if(!firstSpawn){
            mcLog.log('First spawn of '+playerName);
            firstSpawn = true;
            if(config.player.message != null){
                if(typeof config.player.message == 'object'){
                    for (const value of Object.keys(config.player.message)) {
                        
                        setTimeout(() => { 
                            bot.chat(config.player.message[value]); 
                        }, config.player.chatDelay);
                    }
                } else {
                    bot.chat(config.player.message.toString());
                }
            }
        }
        resetMoves();
    });
    bot.on('death', () => {
        mcLog.warn(playerName + ' died!');
        bot.emit('respawn');
    });
    bot.on('time', () => {
        if(!config.player.enabled){
            endBot();
            return;
        }

        if(!firstSpawn) return;

        entity = bot.nearestEntity();
        if(entity && entity.position && entity.isValid && entity.type == 'mob' || entity && entity.position && entity.isValid && entity.type == 'player') bot.lookAt(entity.position.offset(0, 1.6, 0));
        if(config.player.pvp.enabled){
            if(entity && entity.kind && entity.isValid && entity.type == 'mob' && entity.kind.toLowerCase() == 'hostile mobs'){
                onPVP = true;
                bot.pvp.attack(entity);
            } else {
                onPVP = false;
                bot.pvp.stop();
            }
        }

        // Movements
        if (lasttime < 0) {
            lasttime = bot.time.age;
            mcLog.log("Last time set!");
            return;
        }

        let randomadd = Math.random() * maxrandom * 50;
        let interval = moveinterval * 20 + randomadd;

        if (bot.time.age - lasttime > interval) {
            if (onPVP) { return; }

            if (moving){
                bot.setControlState(lastaction,false);
                bot.deactivateItem();

                moving = false;
            } else{
                lastaction = actions[Math.floor(Math.random() * actions.length)];
                bot.setControlState(lastaction,true);
                bot.activateItem();
                
                moving = true;
                lasttime = bot.time.age;
            }

            if(config.debug.movements){
                mcLog.log('Movements:');
                mcLog.log({ age: bot.time.age, lasttime: lasttime, interval: interval, lastaction: lastaction, moving: moving, onPVP: onPVP });
            }
        }

        //bot jump
        if(jump){
            bot.setControlState('jump', true);
            bot.setControlState('jump', false);
            jump = false
        } else {
            bot.setControlState('jump', false);
            setTimeout(() => {
                jump = true;
            }, 1000);
        }
    });
    bot.on('chat', (player, message) => {
        mcLog.log('Chat: '+player+' > '+message);
    });

    // Functions
    function validateCredentials(){
        this.host = (host) => {
            host = host.toString().trim();

            if(host == '') throw new Error("Empty Minecraft player host: "+host);

            return host;
        }
        this.port = (port) => {
            port = parseInt(port);

            if (!util.isNumber || port < 0 || port > 65535){
                throw new Error("Invalid Minecraft player port: "+port);
            }

            return port;
        }
    }
    function endBot(){
        if(mcLoggedIn) return;
        bot.quit();
        bot.end();
    }
    function reConnect(){
        setTimeout(() => {
            mcLoggedIn = false;
            newBot(config.player.name, config.server.ip, config.server.port, config.player.version);
        }, parseInt(config.server.reconnectTimeout));
    }
    function resetMoves(){
        lasttime = -1;
        bot.pvp.stop();
        if (lastaction != null) bot.setControlState(lastaction,false);
        bot.deactivateItem();
        moving = false;
    }
}