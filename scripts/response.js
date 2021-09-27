const Fs = require('fs');
const Yml = require('yaml');
const Version = require('./version');

module.exports = function () {
    this.location = null;
    this.parse = () => {
        if(!this.location || this.location == null) throw new Error("Response file path is null");
        if(!Fs.existsSync(this.location)) throw new Error(this.location + "does not exist");

        let file = Fs.readFileSync(this.location, 'utf-8');
        
        return Yml.parse(file);
    }
}