const Fs = require('fs');
const Yml = require('yaml');
const Version = require('./version');

module.exports = function (){
    this.location = null;
    this.parse = () => {
        if(!this.location || this.location == null) throw new Error("Config path is null");
        if(!Fs.existsSync(this.location)) throw new Error(this.location + "does not exist");

        let file = Fs.readFileSync(this.location, 'utf-8');
        let config = Yml.parse(file);

        if(Version != config.version) throw new Error(config.version + " != " + Version + ": Config version is not supported");

        return config;
    }
}