# SFDX Org Development Model Azure Devops Task - Build & Deploy

This repository implements a Azure Devops Task that's is a variation of the [Bitbucket Pipelines examples with org development](https://github.com/forcedotcom/sfdx-bitbucket-org/). This is also a Azure Devops version of the [SFDX Org Development Model Github Action - Build & Deploy](https://github.com/tiagonnascimento/sfdx-orgdev-build-deploy)

This action is usefull to deploy to non-scratch orgs (sandbox or production) with Azure Pipelines.

The task, once executed will run the following steps:
- Download and install the last version of Salesforce CLI
- Decrypt the private key that should be inside the repo
- Auth in the target sandbox/org using the decrypted key and a JWT grant
- Deploy or Check one or more packages with test level being executed as per the specified input parm
- Deploy or Check destructive changes (optional)
- Execute Apex anonymous script (optional)

## Getting Started

1) If you intent to use it, please go through the Readme of the [Bitbucket Pipelines examples with org development](https://github.com/forcedotcom/sfdx-bitbucket-org/) and make sure you understand the concept and execute the *Getting Started* (of the referred repo) steps #4, 5, 6 and 10

2) Also you will need to add the following Secrets on your Azure repository, that will be later used on your Azure Workflow:

- CLIENT_ID: holds the client_id of the connected app that you created on step #4 of the referred repo
- USERNAME: holds the username that will be used to connect to the target org/sandbox
- DECRYPTION_KEY: holds the KEY value you generated on step #6 of the referred repo - will be used to decrypt the certificate
- DECRYPTION_IV: holds the IV value you generated on step #6 of the referred repo - will be used to decrypt the certificate

## Usage Sample

You can execute the action as per the following sample:

```yaml
# List the branches that the pipeline will execute
trigger:
  branches:
    include:
    - main
    - develop
    - feature/*
    - release/*

# Execute upon opening pull requests
pr:
  branches:
    include:
      - '*'

pool:
  vmImage: ubuntu-latest

variables:
  isFeature: $[startsWith(variables['Build.SourceBranch'], 'refs/heads/feature')]
  isPR2Develop: $[eq(variables['System.PullRequest.TargetBranch'], 'refs/heads/develop')]
  isDevelop: $[eq(variables['Build.SourceBranch'], 'refs/heads/develop')]
  isMain: $[eq(variables['Build.SourceBranch'], 'refs/heads/main')]

stages:
- stage: BU01
  condition: eq(variables.isFeature, true)
  jobs:
  - job: BU01_BUILD_DEPLOY
    steps:
    - task: sfdx-orgdev-build-deploy@1
      displayName: 'BU01 - Build & Deploy'
      inputs:
        type: 'sandbox'
        privateKeyPath: 'cicd/server.key.enc'
        decryptionKey: $(NONPROD_DECRYPTION_KEY)
        decryptionIV: $(NONPROD_DECRYPTION_IV)
        clientID: $(BU01_CLIENTID)
        username: $(BU01_USERNAME)
        manifestFiles: 'manifest/package.xml'

- stage: QA01_VALIDATE
  condition: eq(variables.isPR2Develop, true)
  jobs:
  - job: QA01_BUILD_VALIDATE_DEPLOY
    steps:
    - task: sfdx-orgdev-build-deploy@1
      displayName: 'QA01 - Build & Deploy'
      inputs:
        type: 'sandbox'
        privateKeyPath: 'cicd/server.key.enc'
        decryptionKey: $(NONPROD_DECRYPTION_KEY)
        decryptionIV: $(NONPROD_DECRYPTION_IV)
        clientID: $(QA01_CLIENTID)
        username: $(QA01_USERNAME)
        checkonly: true
        manifestFiles: 'manifest/package.xml'

- stage: QA01
  condition: eq(variables.isDevelop, true)
  jobs:
  - job: QA01_BUILD_DEPLOY
    steps:
    - task: sfdx-orgdev-build-deploy@1
      displayName: 'QA01 - CHECK - Build & Validate the Deploy'
      inputs:
        type: 'sandbox'
        privateKeyPath: 'cicd/server.key.enc'
        decryptionKey: '$(NONPROD_DECRYPTION_KEY)'
        decryptionIV: '$(NONPROD_DECRYPTION_IV)'
        clientID: '$(QA01_CLIENTID)'
        username: '$(QA01_USERNAME)'
        checkonly: false
        manifestFiles: 'manifest/package.xml'
```

### Inputs:
| Name                  | Requirement | Description |
| --------------------- | ----------- | ----------- |
| `type`                | _required_  | Whether to deploy on `production` or on `sandbox` (default value) |
| `privateKeyPath`      | _required_  | Path on the repo where the encrypted private key is stored |
| `decryptionKey`       | _required_  | Decryption KEY to be used to decrypt the private key |
| `decryptionIV`        | _required_  | Decryption IV to be used to decrypt the private key |
| `clientID`            | _required_  | Client ID that will be used to connect into the target org/sandbox |
| `username`            | _required_  | Username that will be used to connect into the target org/sandbox |
| `checkonly`           | _required_  | Boolean value to indicate whether this action should execute the deploy or only check it, default is false, but if true it will add -c parameter on the force:mdapi:deploy commands |
| `manifestFiles`       | _required_  | Path on the current repository to one or more package.xml that represents the packages to be deployed. Based on this files the metadata package will be created and deployed in the order specified. Ex:  | manifest/package-01.xml,manifest/package-02.xml,manifest/package-03.xml
| `deployWaitTime`      | _optional_  | Wait time for deployment to finish in minutes. Default is `10` |
| `destructivePath`     | _optional_  | Path on the repo where the destructive changes directory is - if not informed, it's not executed |
| `anonymousApex`       | _optional_  | Path on the repo where an APEX script used as a data factory / automation is stored. if not informed, it's not executed |


# Note for destructives changes.

The `destructive_path` input is a path folder, with two files inside. For example if we have the following folder structure

```bash
  |-- config
  |-- devops
  |-- force-app
  |-- manifest
  |-- releases
    |-- 01_releases
       |-- destructive
          |-- package.xml
          |-- destructiveChanges.xml
  |-- scripts
  |-- .forceignore
  |-- .gitignore
  ...
  |-- sfdx-project.json 
```  

The `destructive_path` will be `releases/01_releases/destructive`.


## Contributing to the Repository

If you find any issues or opportunities for improving this repository, fix them! Feel free to contribute to this project by [forking](http://help.github.com/fork-a-repo/) this repository and making changes to the content. Once you've made your changes, share them back with the community by sending a pull request. See [How to send pull requests](http://help.github.com/send-pull-requests/) for more information about contributing to GitHub projects.

## Reporting Issues

If you find any issues with this demo that you can't fix, feel free to report them in the [issues](https://github.com/tiagonnascimento/azuredevops-sfdx-orgdev-build-deploy/issues) section of this repository.
