const tl = require('azure-pipelines-task-lib/task');
const sfdx = require('./utils/sfdx.js');

try {
  
    console.log("=== Executing task ===");
    
    //Install dependecies  
    sfdx.install();
    
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
    deploy.destructivePath = tl.getInput('destructivePath');
    deploy.anonymousApex = tl.getInput('anonymousApex');
    deploy.checkonly = tl.getBoolInput('checkonly');
    deploy.deployWaitTime = tl.getInput('deployWaitTime'); 

    console.log('Deloy parameters: ' + JSON.stringify(deploy));

    //auth to Org
    sfdx.auth(key, destination);
  
    //Deply/Checkonly to Org
    sfdx.deploy(deploy);
    
    //Destructive deploy
    sfdx.destructiveDeploy(deploy);
  
    //Executes data factory script
    sfdx.anonymousApex(deploy);

  } catch (error) {
      console.error(error.message);
      tl.setResult(tl.TaskResult.Failed, error.message);
  }
  