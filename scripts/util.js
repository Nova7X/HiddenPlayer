const Commander = require('commander');
const Logger = require('./logger');

const log = new Logger();
log.defaultPrefix = 'Utility';

const program = new Commander.Command;
    
    program
            .option('--testmode', 'Enable testmode')
            .option('--minecraft-player-name <playername>', 'Player name for testmode Minecraft bot')
            .option('--minecraft-server-ip <ip>', 'Server IP for testmode server')
            .option('--minecraft-server-port <port>', 'Server port for testmode server')
            .option('--minecraft-player-join-msg <message>', 'test mode on join message')
            .option('--discord <token>', 'Testmode discord bot')
            .option('--testmode-timeout <timeout>', 'Test mode timeout in milliseconds')
    program.parse();

module.exports = function (){
    this.loop = (num = 0, str = '') => {
        var returnVal = '';
        for (let i = 0; i < num; i++) {
            returnVal += str;
        }
        return returnVal;
    }
    this.replaceAll = (str, find, replace) => {
        if(str == null) { return; }
        return str.toString().replace(new RegExp(escapeRegExp(find), 'g'), replace);
    }
    this.randomInteger = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    this.limitText = (text = null) => {
        if(text != null && text.length >= 100){
            text = text.substr(0,100) + "...";
        }
        return text;
    }
    this.trimUnicode = (text) => {
        if(text == null) {return true;}
        text = text.trim();
        text = this.replaceAll(text,"'",'');
        text = this.replaceAll(text,".",'');
        text = this.replaceAll(text,"/",'');
        text = this.replaceAll(text,"\\",'');
        return text;
    }
    this.escapeRegExp = (string) => {
        return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
    this.isNumber = (n) => {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }   
    this.splitCommand = (text = '', removeQuotations = false) => {
        let regex = new RegExp("(?<=^[^\"]*(?:\"[^\"]*\"[^\"]*)*) (?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
        text = text.trim();
        text = this.escapeRegExp(text);
        text = text.split(regex);
        if(removeQuotations){
            let newText = [];
            for (const value of text) {
                newText.push(this.replaceAll(this.replaceAll(value, '"', ''), "\\", ''));
            }
            text = newText;
        }
    
        return text;
    }
    this.makeSentence = (object = [], skip = 0) => {
        if(typeof object === 'object' && Object.keys(object).length > 0) {
            let outputText = '';
            for (let i = 0; i < Object.keys(object).length; i++) {
                if(i < skip) { continue; }
    
                outputText += ' ' + object[Object.keys(object)[i]];
            }
            return outputText.trim();
        }
    }
    this.testMode = (config = {}) => {
        if(!program.opts().testmode) return config;

        log.log("Test mode enabled!");

        config['server']['ip'] = 'play.ourmcworld.ml';
        config['server']['port'] = 39703;
        config['player']['name']= 'HiddenPlayer';

        let timeout = 300000;

        switch (true) {
            case (program.opts().minecraftServerIp != null):
                config['server']['ip'] = program.opts().minecraftServerIp
                break;
            case (program.opts().minecraftServerPort != null):
                config['server']['port'] = program.opts().minecraftServerPort
                break;
            case (program.opts().minecraftPlayerName != null):
                config['player']['name'] = program.opts().minecraftPlayerName
                break;        
            case (program.opts().minecraftPlayerJoinMsg != null):
                config['player']['message'] = program.opts().minecraftPlayerJoinMsg
                break;
            case (program.opts().discord != null):
                config['discord']['token'] = program.opts().discord
                break;
            case (program.opts().testmodeTimeout != null):
                timeout = parseInt(program.opts().testmodeTimeout, 10)
                break;        
            default:
                break;
        }

        setTimeout(() => {
            log.log('Test mode timeout');
            process.exit(0);
        }, timeout);

        return config;
    }
}