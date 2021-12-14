const cmd = require('./cmd.js');

let install = async () => {
    console.log('=== Installing SFDX cli ===');
    cmd.run('sudo', ['npm', 'install', '--global', 'sfdx-cli@latest']);
    console.log('=== SFDX cli installed ===');
    cmd.run('sfdx',['version']);
};

let auth = async (key, destination) => {
    console.log("=== login ===");
    console.log('=== Decrypting private key ===');
    cmd.run('openssl', ['enc', '-nosalt', '-aes-256-cbc', '-d', '-in', key.privateKeyPath, '-out', 'server.key', '-base64', '-K', key.decryptionKey, '-iv', key.decryptionIV]);

    console.log('==== Authenticating in the target org ===');
    const instanceurl = destination.type === 'sandbox' ? 'https://test.salesforce.com' : 'https://login.salesforce.com';
    console.log('Instance URL: ' + instanceurl);
    cmd.run('sfdx', ['force:auth:jwt:grant', '--instanceurl', instanceurl, '--clientid', destination.clientID, '--jwtkeyfile', 'server.key', '--username', destination.username, '--setalias', 'sfdc']);
};

let deploy = async (deploy) => {
    console.log("=== deploy ===");

    let manifestFilesArray = deploy.manifestFiles.split(",");
   
    for(var i = 0; i < manifestFilesArray.length; i++){
        let argsDeploy = ['force:source:deploy', '--wait', deploy.deployWaitTime, '--manifest', manifestFilesArray[i], '--targetusername', 'sfdc', '--testlevel', 'RunLocalTests', '--json'];

        if(deploy.checkonly){
            console.log("===== CHECH ONLY ====");
            argsDeploy.push('--checkonly');
        }

        if (deploy.preDestructivePath && i == 0) {
            console.log("===== adding pre destructive changes ====");
            argsDeploy.push('--predestructivechanges');
            argsDeploy.push(deploy.preDestructivePath);
            argsDeploy.push('-g');
        }

        if (deploy.postDestructivePath && i == manifestFilesArray.length - 1) {
            console.log("===== adding post destructive changes ====");
            argsDeploy.push('--postdestructivechanges');
            argsDeploy.push(deploy.postDestructivePath);
            argsDeploy.push('-g');
        }

        cmd.run('sfdx', argsDeploy);
    }
};

let anonymousApex = async (deploy) => {
    if (deploy.anonymousApex != null && deploy.anonymousApex != undefined && deploy.anonymousApex != '' && !deploy.checkonly) {
        console.log("=== Anonymous Apex ===");
        console.log('Executing Anonymous Apex');
        cmd.run('sfdx', ['force:apex:execute', '-f', deploy.anonymousApex, '-u', 'sfdc']);
    }
};

module.exports.install = install;
module.exports.auth = auth;
module.exports.deploy = deploy;
module.exports.anonymousApex = anonymousApex;