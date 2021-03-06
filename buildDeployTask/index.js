const tl = require('azure-pipelines-task-lib/task');
const sfdx = require('./utils/sfdx.js');
  
console.log("=== Executing task ===");

//Load private key params
let key = {};
key.privateKeyPath = tl.getInput('privateKeyPath', true);
key.decryptionKey = tl.getInput('decryptionKey', true);
key.decryptionIV = tl.getInput('decryptionIV', true);

//Load destionation params
let destination = {};
destination.type = tl.getInput('type', true);
destination.clientID = tl.getInput('clientID', true);
destination.username = tl.getInput('username', true);

//Load deploy params
let deploy = {};
deploy.manifestFiles = tl.getInput('manifestFiles', true);
deploy.preDestructivePath = tl.getInput('preDestructivePath');
deploy.postDestructivePath = tl.getInput('postDestructivePath');
deploy.anonymousApex = tl.getInput('anonymousApex');
deploy.checkonly = tl.getBoolInput('checkonly');
deploy.deployWaitTime = tl.getInput('deployWaitTime'); 

console.log('Deloy parameters: ' + JSON.stringify(deploy));

async function execute() {

    //Install dependecies  
    await sfdx.install();

    //auth to Org
    await sfdx.auth(key, destination);
  
    //Deply/Checkonly to Org
    await sfdx.deploy(deploy);
  
    //Executes data factory script
    await sfdx.anonymousApex(deploy);
}

execute().catch(e => {
    console.error(e.message);
    tl.setResult(tl.TaskResult.Failed, e.message);
});
  