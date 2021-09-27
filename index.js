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

    bot.on('ready', () => {
        mcLog.error('e');
    });
    bot.on('kicked banned error disconnect', (reason) => {
        mcLog.warn(playerName + " left the game: " + reason)
        endBot();
    });
    bot.on('end', () => {
        mcLog.warn(playerName + " Ended!");
        reConnect();
    });
    bot.on('spawn', () => {
        if()
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
            newBot();
        }, parseInt(config.server.reconnectTimeout));
    }
}