# Continuous Integration and Deployment of the Gradoop Service

The Gradoop Service is developed using a GitLab instance. To check commits and update the running instance, we utilize the GitLab continuous integration (CI) features together with docker and some scripts.


## Summary

Each commit of the GitLap project for the Gradoop Service triggers a `mvn verify` and the result is displayed in several GitLab pages. In case of an error, the push user gets send an email.

Snapshots can get deployed via the GitLab projects pipeline page to the deployment server. The hash of the deployed snapshot can be found in the current docker image tag and by checking the file "version.txt", which contains the deployment date as well. The "version.txt" file is created during deployment in the same folder as "index.html" and is accessible via web as well.


## GitLab's Continuous integration features used

### GitLab Runner

GitLab's Continuous Integration (CI) needs a [GitLab Runner](https://docs.gitlab.com/runner/). We use a GitLab Runner with the [Docker Executor](https://docs.gitlab.com/runner/executors/docker.html).

The GitLab Runner is associated with the GitLab Project by a registration token and GitLab Url provided in the GitLap Projects settings page for pipelines.

### GitLab Pipeline

The file [`gitlab-ci.yml`](https://docs.gitlab.com/ee/ci/yaml/README.html) in the Git repository defines [pipelines and jobs](https://docs.gitlab.com/ee/ci/pipelines.html) executed whenever GitLab receives a commit. The jobs can get triggered manually on GitLabs web frontend as well.

A job defition in `gitlab-ci.yml` has a script section, listing shell commands for this job to be executed on the GitLab Runner. In our case an independent docker container on the machine hosting the GitLab Runner is created for each job. Other job settings can be used to define e.g. dependencies or when a job should get executed.

### CI Secret Variables

In the GitLab Projects pipeline settings page (project -> settings -> pipelines) one can define secret variables made available in the Jobs as environment files.

## Continuous Deployment of our web service

### Problem description

Our CI jobs (and Continuous Deployment(CD) jobs) get executed in a docker container to ensure reproducibility. Our web service is deployed to a docker container as well, to get a clearly defined environment and make switching between service versions fast.

GitLabs CI jobs are designed for tasks with limited lifespan and no interaction between them. Our web service designed as long running service executable. Because of this we decided against using GitLabs CI Jobs as service runtime environment but needed some way of triggering a service update from a GitLab CI job. As our CI Jobs get executed in a docker container we have to manage another docker container from within a docker container.

There are several possible way to do to that, including the following:
* running CI jobs in privileged docker containers -> prompts for security problems
* using a network interface between the two docker containers for service updates -> we would have much work to do and maybe pollute the clean environment in our service docker container.
* using a ssh connection to the docker host to build a fresh image and restart the container -> this ssh connection needs to get secured to prevent tempering of our host machine

### Architecture used

We decided to use a ssh connection from the job container to the service host for updating the service container in combination with a shared volume in the docker configuration to make the data transfer faster. The usage of the shared volume is only possible when the GitLab Runner job container is located on the same machine as the service, otherwise a scp could get used. 

1. Deployment Job copies the current repository snapshot via shared volume to the service host.
2. Deployment Job connects via SSH to the service host and executes an update script on the service host:
   1. The update script builds a new docker image from the current repository snapshot
   2. The update script stops the old service container and starts a new one  

Each repository snapshot gets stored in a timestamped directory for documentation as well as reducing possible problems when multiple deployment tasks run concurrently. 
   
### Security considerations

The Service Host machine features a dedicated deployment login. SSH login for this user is limited to local docker container IP addresses and a specific ssh key (via `from=` entry in `authorized_keys` file). This SSH key together with the Host key is stored in the GitLab project as secret variable and provided to the CI jobs as environment variable, similar to GitLab documentation on [ssh keys with CI](https://docs.gitlab.com/ee/ci/ssh_keys/README.html).
Note: GitLabs secret variables are not very secure as [mentioned already in the GitLab documentation](https://docs.gitlab.com/ee/ci/variables/README.html#secret-variables).

The dedicated deployment login needs access to docker commands. This should be filtered in the sudoers config to only specific commands as unfiltered access to docker commands is similar to root access.

### updating the docker service

Updating the docker service is done in the script `runOnDocker.sh`. This script deals with updating the image and switching fast from old to new container instance.

Building the container is the first crucial step and takes quite some time as all dependencies has to get downloaded and all tests get executed. If any problems occur here no deployment is feasible and the script stops before touching the old container.

The fresh image is created with a tag containing the date of creation and the git snapshot hash. If an old image with the tag 'latest' is found, it is given the tag 'old' before tagging the new image with the 'latest' tag. As our service images require several 100 MBytes we remove after deployment all service images older than the one tagged 'old'.

To make a fast switch between old and new service container, we rename the old container and stop it before starting the new one. Apparently it takes some time to remove a docker container and the container name can not be reused before the removal is completed. This makes the script a little bit complicated, but we reduce the interval between old and new container to about 1 second. Another possible solution for switching the service container would be to utilize the docker tool [Watchtower](https://github.com/v2tec/watchtower).

Note: As we use currently no persistent storage, updating the service container removes all user data and user sessions.



## Details

### Configuration of the GitLab Runner

The GitLab runner is configured in the file `/etc/gitlab-runner/config.toml`.

As we do not want to upload our docker images to some docker image repository, we changed the pull policy to ["if-not-present"](https://docs.gitlab.com/runner/executors/docker.html#using-the-if-not-present-pull-policy) by adding the line `pull_policy = "if-not-present"` into the "runners.docker" section

The shared volume is defined with the "volumes" parameter in the "runners.docker" section: `volumes = ["/cache", "/home/deployer/deploy-volume:/deploy"]`

### scripts used

#### gitlab-ci.yml

Job definition in the root directory of the git repository. Defines 3 Jobs: 
* **print-debug-info**: prints out some version number and environment variables
* **verify**: execute `mvn --batch-mode clean verify`. "--batch-mode" is needed to limit the dependency-download output.
* **deploy**: triggers the deployment by setting up the ssh key and calling the "deploy.sh" script in the "ci" folder

#### ci/deploy.sh

This shell script starts the deployment in the job container.

It creates in the shared folder a directory with the current date and time in it's name, copies the relevant part of the snapshot (below `maven_project/gradoop-service`) into it and executes via ssh the runOnDocker.sh script on the deploy host.

A file "version.txt" is created in the web folder which contains "index.html" as well. The deployment date and the hash of the Git snapshot deployed is written into this file.

#### maven_project/gradoop-service/runOnDocker.sh

This shell script builds a docker image from the current directory and switches the docker service container.

If an alphanumeric snapshot hash is given as parameter, it is appended to the new images tag.


## open tasks

* secure docker commands via sudo filter
* cleanup of old snapshot folders in deploy directory - some should be kept for documentation
* cleanup of service container - only some files are really used but all are copied in the "runOnDocker.sh" script.