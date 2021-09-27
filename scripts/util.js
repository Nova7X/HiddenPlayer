const Commander = require('commander');

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
    this.testMode = (config) => {
        return config;
    }
}