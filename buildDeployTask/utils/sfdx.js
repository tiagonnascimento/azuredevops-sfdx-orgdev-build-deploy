const cmd = require('./cmd.js');

let install = function(){
    console.log('=== Downloading and installing SFDX cli ===');
    cmd.run('wget', ['https://developer.salesforce.com/media/salesforce-cli/sfdx-linux-amd64.tar.xz']);
    cmd.run('mkdir', ['-p', 'sfdx-cli']);
    cmd.run('tar', ['xJf', 'sfdx-linux-amd64.tar.xz', '-C', 'sfdx-cli', '--strip-components', '1']);
    cmd.run('./sfdx-cli/install', []);
    console.log('=== SFDX cli installed ===');
};

let auth = function (key, destination){
    console.log("=== login ===");
    console.log('=== Decrypting private key');
    cmd.run('openssl', ['enc', '-nosalt', '-aes-256-cbc', '-d', '-in', key.privateKeyPath, '-out', 'server.key', '-base64', '-K', key.decryptionKey, '-iv', key.decryptionIV]);

    console.log('==== Authenticating in the target org');
    const instanceurl = destination.type === 'sandbox' ? 'https://test.salesforce.com' : 'https://login.salesforce.com';
    console.log('Instance URL: ' + instanceurl);
    cmd.run('sfdx', ['force:auth:jwt:grant', '--instanceurl', instanceurl, '--clientid', destination.clientID, '--jwtkeyfile', 'server.key', '--username', destination.username, '--setalias', 'sfdc']);
};

let deploy = function (deploy){
    console.log("=== deploy ===");

    let manifestFilesArray = deploy.manifestFiles.split(",");
   
    for(var i = 0; i < manifestFilesArray.length; i++){
        let argsDeploy = ['force:source:deploy', '--wait', deploy.deployWaitTime, '--manifest', manifestFilesArray[i], '--targetusername', 'sfdc', '--testlevel', 'RunLocalTests', '--json'];

        if(deploy.checkonly){
            console.log("===== CHECH ONLY ====");
            argsDeploy.push('--checkonly');
        }

        cmd.run('sfdx', argsDeploy);
    }
};

let destructiveDeploy = function (deploy){
    if (deploy.destructivePath != null && deploy.destructiveDeploy != undefined && deploy.destructivePath !== '') {
        console.log("=== destructiveDeploy ===");
        console.log('=== Applying destructive changes ===')
        var argsDestructive = ['force:mdapi:deploy', '-d', deploy.destructivePath, '-u', 'sfdc', '--wait', deploy.deployWaitTime, '-g', '--json'];
        if (deploy.checkonly) {
            argsDestructive.push('--checkonly');
        }
        cmd.run('sfdx', argsDestructive);
    }
};

let anonymousApex = function (deploy){
    if (deploy.anonymousApex != null && deploy.anonymousApex != undefined && deploy.anonymousApex != '' && !deploy.checkonly) {
        console.log("=== Anonymous Apex ===");
        console.log('Executing Anonymous Apex');
        cmd.run('sfdx', ['force:apex:execute', '-f', deploy.anonymousApex, '-u', 'sfdc']);
    }
};

module.exports.install = install;
module.exports.auth = auth;
module.exports.deploy = deploy;
module.exports.destructiveDeploy = destructiveDeploy;
module.exports.anonymousApex = anonymousApex;