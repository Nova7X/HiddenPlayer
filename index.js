// HiddePlayer GPL-3.0 License
// Modules
const InternalVersion = require('./scripts/version');

const Fs = require('fs');
const ScriptUtility = require('./scripts/util');
const FileConfig = require('./scripts/config');
const FileLanguange = require('./scripts/language');
const FileResponse = require('./scripts/response');

const Commander = require('commander');
const prompt = require('prompt-sync')();

const Discord = require('discord.js');

const Mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const PvpBot = require('mineflayer-pvp').plugin;

const Startup = require('./scripts/startup')();


// Assemly
const util = new ScriptUtility();
const parseConfig = new FileConfig();
const parseLanguage = new FileLanguange();
const parseResponse = new FileResponse();
const Logger = require('./scripts/logger');

parseConfig.location = './config/config.yml';
parseLanguage.location = './config/language.yml';
parseResponse.location = './config/response.yml';
let log = new Logger();
let language = {};
let response = {};
let config = prefillConfig(parseConfig.parse());


// Core Process
log.log(language);
log.log(response);
log.log(config);


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