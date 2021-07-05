# SFDX Org Development Model Azure Devops Task - Build & Deploy

This repository implements a Azure DevOps Task that's is a variation of the [Bitbucket Pipelines examples with org development](https://github.com/forcedotcom/sfdx-bitbucket-org/). This is also a Azure DevOps version of the [SFDX Org Development Model Github Action - Build & Deploy](https://github.com/tiagonnascimento/sfdx-orgdev-build-deploy)

This action is usefull to deploy to non-scratch orgs (sandbox or production) with Azure Pipelines.

The task, once executed will run the following steps:
- Download and install the last version of Salesforce CLI;
- Decrypt the private key that has to be stored inside the repo;
- Auth in the target sandbox/org using the decrypted key and a JWT grant;
- Deploy (or validate the deployment)  one or more packages based on manifest files you provided as input parameter;
- Deploy (or validate) destructive changes (optional)
- Execute an anonymous APEX script provided (optional)

## Getting Started

1) If you intent to use it, please go through the Readme of the [Bitbucket Pipelines examples with org development](https://github.com/forcedotcom/sfdx-bitbucket-org/) and make sure you understand the concept and execute the *Getting Started* (of the referred repo) steps #4, 5, 6 and 10

2) Create a Azure [Variable Group](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups?view=azure-devops&tabs=yaml) on your organization. On the yaml example down below this variable group is referred as `PIPELINE_VARS`. The following variables will be part of this variable group:

- CLIENTID: holds the client_id of the connected app that you created on step #4 of the referred repo. It should be created one different variable per connected environemnt.
- USERNAME: holds the username that will be used to connect to the target org/sandbox. Again, it should be created one different variable per connected environment. 
- DECRYPTION_KEY: it's a secret and holds the KEY value you generated to encrypt the private key and store it inside the repo. The task will use this secret on runtime to decrypt the key and use it to perform a JWT grant with the target sandbox/org. You should define one variable per different key you use. Normally the indication would be use a pair private key / self signed certificate for all non production environment and one for production envirment. That way you would have two decryption key variables/secrets defined in the variable group.  
- DECRYPTION_IV: it's a secret and holds the IV valeu you generated to encrypt the private key. Same comments done about decryption KEY are valid here.

3) Create the pipelines as per the example down bellow:

## Usage Sample

You can execute the action as per the following sample:

```yaml
# List of branches listenings to pushes
trigger:
  branches:
    include:
    - develop
    - feature/*

# Executing pipeline on pull requests
pr:
  branches:
    include:
      - '*'

pool:
  vmImage: ubuntu-latest

# Variables being defined before, only to facilitate reading of the yaml
variables:
- group: 'PIPELINE_VARS'
- name: isFeature
  value: $[startsWith(variables['Build.SourceBranch'], 'refs/heads/feature')]
- name: isPR2Develop
  value: $[eq(variables['System.PullRequest.TargetBranch'], 'refs/heads/develop')]
- name: isDevelop
  value: $[eq(variables['Build.SourceBranch'], 'refs/heads/develop')]
- name: isMain
  value: $[eq(variables['Build.SourceBranch'], 'refs/heads/main')]

# each stage has a condition - it will be skipped if the condition is not achieved. The conditions were already calculated before.
stages:
- stage: BU01
  condition: eq(variables.isFeature, true)
  jobs:
  - job: BU01_BUILD_DEPLOY
    steps:
    - task: sfdx-orgdev-build-deploy@1
      displayName: 'BU01 - Build & Deploy'
      inputs:
        type: 'production'
        privateKeyPath: 'auth-pipelines/server.key.enc'
        decryptionKey: $(NONPROD_DECRYPTION_KEY)
        decryptionIV: $(NONPROD_DECRYPTION_IV)
        clientID: $(BU01_CLIENTID)
        username: $(BU01_USERNAME)
        manifestFiles: 'manifest/package.xml,manifest/package2.xml'
        destructivePath: 'destructive/'
        anonymousApex: 'scripts/apex/hello.apex'

- stage: QA01_VALIDATE
  condition: eq(variables.isPR2Develop, true)
  jobs:
  - job: QA01_BUILD_VALIDATE_DEPLOY
    steps:
    - task: sfdx-orgdev-build-deploy@1
      displayName: 'QA01 - Build & Deploy'
      inputs:
        type: 'production'
        privateKeyPath: 'auth-pipelines/server.key.enc'
        decryptionKey: $(NONPROD_DECRYPTION_KEY)
        decryptionIV: $(NONPROD_DECRYPTION_IV)
        clientID: $(QA01_CLIENTID)
        username: $(QA01_USERNAME)
        checkonly: true
        manifestFiles: 'manifest/package.xml,manifest/package2.xml'
        destructivePath: 'destructive/'
        anonymousApex: 'scripts/apex/hello.apex'

- stage: QA01
  condition: eq(variables.isDevelop, true)
  jobs:
  - job: QA01_BUILD_DEPLOY
    steps:
    - task: sfdx-orgdev-build-deploy@1
      displayName: 'QA01 - CHECK - Build & Validate the Deploy'
      inputs:
        type: 'production'
        privateKeyPath: 'auth-pipelines/server.key.enc'
        decryptionKey: '$(NONPROD_DECRYPTION_KEY)'
        decryptionIV: '$(NONPROD_DECRYPTION_IV)'
        clientID: '$(QA01_CLIENTID)'
        username: '$(QA01_USERNAME)'
        checkonly: false
        manifestFiles: 'manifest/package.xml,manifest/package2.xml'
        destructivePath: 'destructive/'
        anonymousApex: 'scripts/apex/hello.apex'
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
| `manifestFiles`       | _required_  | Path on the current repository to one or more package.xml that represents the packages to be deployed. Based on this files the metadata package will be created and deployed in the order specified. Ex:  `manifest/package-01.xml,manifest/package-02.xml,manifest/package-03.xml` |
| `deployWaitTime`      | _optional_  | Wait time for deployment to finish in minutes. Default is `10` |
| `destructivePath`     | _optional_  | Path on the repo where the destructive changes directory is - if not informed, it's not executed |
| `anonymousApex`       | _optional_  | Path on the repo where an APEX script used as a data factory / automation is stored. if not informed, it's not executed |

### Note for destructives changes.

The `destructive_path` input is a path folder, with two files inside. For example if we have the following folder structure

```bash
  |-- config
  |-- auth-pipeline
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

### Use on a Azure Release

You can use this task on a Azure Releae as well, but to do that, you will need to first copy all files from the Artifact directory to the execution folder. You can achieve that using a builtin Task `Copy Files to:` using as the Source Folder the Artifact directory and the Target Folder simply: `.` 

## Contributing to the Repository

If you find any issues or opportunities for improving this repository, fix them! Feel free to contribute to this project by [forking](http://help.github.com/fork-a-repo/) this repository and making changes to the content. Once you've made your changes, share them back with the community by sending a pull request. See [How to send pull requests](http://help.github.com/send-pull-requests/) for more information about contributing to GitHub projects.

## Reporting Issues

If you find any issues with this demo that you can't fix, feel free to report them in the [issues](https://github.com/tiagonnascimento/azuredevops-sfdx-orgdev-build-deploy/issues) section of this repository.
