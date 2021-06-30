const tl = require('azure-pipelines-task-lib/task');
const sfdx = require('./utils/sfdx.js');

try {
  
    console.log("=== Executing task ===");
    
    //Install dependecies  
    sfdx.install();
    
    //Load private key params
    let key = {};
    key.privateKeyPath = tl.getInput('privateKeyPath');
    key.decryptionKey = tl.getInput('decryptionKey');
    key.decryptionIV = tl.getInput('decryptionIV');
  
    //Load destionation params
    let destionation = {};
    destination.type = tl.getInput('type');
    destination.clientID = tl.getInput('clientID');
    destination.username = tl.getInput('username');
    
    //Load deploy params
    let deploy = {};
    deploy.manifestFiles = tl.getInput('manifestFiles');
    deploy.destructivePath = tl.getInput('destructivePath');
    deploy.anonymousApex = tl.getInput('anonymousApex');
    deploy.checkonly = tl.getInput('checkonly');
    deploy.deployWaitTime = tl.getInput('deployWaitTime'); 

    //auth to Org
    sfdx.auth(key, destination);
  
    //Deply/Checkonly to Org
    sfdx.deploy(deploy);
    
    //Destructive deploy
    sfdx.destructiveDeploy(deploy);
  
    //Executes data factory script
    sfdx.dataFactory(deploy);

  } catch (error) {
      console.error(error.message);
      tl.setResult(tl.TaskResult.Failed, error.message);
  }
  