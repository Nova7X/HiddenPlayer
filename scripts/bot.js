const Logger = require('./logger');
const Utility = require('./util');
const Mineflayer = require('mineflayer');
const MineflayerCmd = require('mineflayer-cmd').plugin;
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const PvpBot = require('mineflayer-pvp').plugin;
const Emitter = require('events').EventEmitter;
const { read } = require('fs');

const util = new Utility();
const mcLog = new Logger();
module.exports = function (){
    const event = new Emitter();
    this.mcLoggedIn = false;            // If the has logged in
                                        //
    this.serverIp = '';                 // Server IP 
    this.serverPort = 25565;            // Server port
    this.serverVersion = null;          // Server version
    this.playerName = 'HiddenPlayer';   // Player name
    this.playerChatDelay = 1000;        // Player chats delay
    this.playerPvp = false;             // Enable player pvp
    this.joinMessage = 'hello';         // onJoin player message (Sting || Object)

    this.lastTime = -1;                                     // Last recorded time
    this.actions = ['forward', 'back', 'left', 'right'];    // Random actions
    this.moveInterval = 5;                                  // Movement interval
    this.maxRandom = 5;                                     // Max Movement interval
    this.lastAction = null;                                 // Last recorded action
    
    this.consolePrefix = 'Minecraft';                       // Console prefix
    this.logMovements = false;       
    this.disabled = false;                      // Log movements to console

    var onPvp = false;
    var moving = false;
    var jump = true;

    this.newBot = () => {
        mcLog.defaultPrefix = this.consolePrefix;
        mcLog.log("Creating new bot");

        // Connection
        if(this.alreadyConnected()) { mcLog.warn("Player already connected to a server"); return; }
        if(this.isDisabled()) { mcLog.warn("Player Disabled"); return; }
    
        let serverIp = this.validateCredsHost(this.serverIp);
        let serverPort = this.validateCredsPort(this.serverPort);
        let playerName = this.playerName;
        let serverVersion = this.serverVersion;

        let entity = null;
        let chatDelay = this.playerChatDelay;

        mcLog.log(playerName + " is ready to connect!");

        // Bot
        const connection = { host: serverIp, port: serverPort, username: playerName, version: serverVersion };
        event.emit('ready', this.playerName, this.serverIp, this.serverPort, this.serverVersion);
    
        mcLog.log('Connecting...');
        mcLog.log(connection);
        var bot = Mineflayer.createBot(connection);
    
        bot.loadPlugin(MineflayerCmd);
        bot.loadPlugin(pathfinder);
        bot.loadPlugin(PvpBot);
    
        this.mcLoggedIn = true;
        let firstSpawn = false;
    
        bot.on('kicked', (reason) => {
            mcLog.warn(playerName + " left the game: " + reason);
            event.emit('kicked', reason);
            this.endBot(bot);
        });
        bot.on('error', (reason) => {
            mcLog.error(playerName + " left the game: " + reason);
            event.emit('error', reason);
            this.endBot(bot);
        });
        bot.on('end', () => {
            mcLog.warn(playerName + " Ended!");
            event.emit('end');
            this.reConnect(bot);
        });
        bot.on('spawn', async () => {
            event.emit('spawn');
            if(!firstSpawn){
                mcLog.log('First spawn of '+playerName);
                firstSpawn = true;
                let joinMessage = this.joinMessage;
                event.emit('firstSpawn');
                if(joinMessage != null){
                    if(typeof joinMessage == 'object'){
                        for (const value of Object.keys(joinMessage)) {
                            
                            setTimeout(() => { 
                                mcLog.log('Message sent: '+joinMessage[value]);
                                bot.chat(joinMessage[value]); 
                            }, chatDelay);
                        }
                    } else {
                        mcLog.log('Message sent: '+joinMessage.toString());
                        bot.chat(joinMessage.toString());
                    }
                }
            }
            this.resetMoves(bot);
        });
        bot.on('death', () => {
            mcLog.warn(playerName + ' died!');
            bot.emit('respawn');
            event.emit('death');
        });
        bot.on('time', () => {
            if(this.isDisabled()){ this.endBot(bot); return; }
            if(!firstSpawn) return;
            
            event.emit('time');
            entity = bot.nearestEntity();
            if(entity && entity.position && entity.isValid && entity.type == 'mob' || entity && entity.position && entity.isValid && entity.type == 'player') bot.lookAt(entity.position.offset(0, 1.6, 0));
            if(this.playerPvp){
                if(entity && entity.kind && entity.isValid && entity.type == 'mob' && entity.kind.toLowerCase() == 'hostile mobs'){
                    onPvp = true;
                    bot.pvp.attack(entity);
                    event.emit('onPvpStart', entity);
                } else {
                    onPvp = false;
                    bot.pvp.stop();
                    event.emit('onPvpStop', entity);
                }
            }
    
            // Movements
            if (this.lastTime < 0) {
                this.lastTime = bot.time.age;
                mcLog.log("Last time set!");
                return;
            }
    
            let randomadd = Math.random() * this.maxRandom * 50;
            let interval = this.moveInterval * 20 + randomadd;
    
            if (bot.time.age - this.lastTime > interval) {
                if (onPvp) { return; }
    
                if (moving){
                    bot.setControlState(this.lastAction,false);
                    bot.deactivateItem();
    
                    moving = false;
                } else{
                    this.lastAction = this.actions[Math.floor(Math.random() * Object.keys(this.actions).length)];
                    bot.setControlState(this.lastAction,true);
                    bot.activateItem();
                    
                    moving = true;
                    this.lastTime = bot.time.age;
                }
    
                if(this.logMovements){
                    mcLog.log('Movements:');
                    mcLog.log({ age: bot.time.age, lastTime: this.lastTime, interval: interval, lastAction: this.lastAction, moving: moving, onPVP: onPVP });
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
            event.emit('chat', player, message);
            mcLog.log('Chat: '+player+' > '+message);
        });
    }
    this.alreadyConnected = () => {
        if(this.mcLoggedIn) return true;
        return false;
    }

    this.isDisabled = () => {
        if(this.disabled) return true;
        return false;
    }

    this.endBot = (bot) => {
        if(this.mcLoggedIn || !bot) return;
        bot.quit();
        bot.end();
    }
    this.reConnect = (bot) => {
        if(!bot) return;
        setTimeout(() => {
            event.emit('reConnect');
            this.mcLoggedIn = false;
            this.newBot();
        }, parseInt(this.reconnectTimeout));
    }
    this.resetMoves = (bot) => {
        if(!bot) return;
        event.emit('movesReset');
        this.lastTime = -1;
        bot.pvp.stop();
        if (this.lastAction != null) bot.setControlState(this.lastAction,false);
        bot.deactivateItem();
        moving = false;
    }

    this.validateCredsHost = (serverIp) => {
        serverIp = serverIp.toString().trim();

        if(serverIp == '') throw new Error("Empty Minecraft player host: "+serverIp);

        return serverIp;
    }
    this.validateCredsPort = (serverPort) => {
        serverPort = parseInt(serverPort);

        if (!util.isNumber || serverPort < 0 || serverPort > 65535){
            throw new Error("Invalid Minecraft player port: "+serverPort);
        }
        return serverPort;
    }

    this.events = event;
}