#!/bin/bash
##==============
## script for deploying the gradoop service on the server
## as docker container.
##
## expects:
## * local directory '/deploy' mounted to '/home/deployer/deploy-volume'
##   on the deployment server 'gradoopwebctl.sc.uni-leipzig.de
## * a passwordless login for user 'deployer' to deployment server,
##   meaning a password less ssh key present in a ssh key agent
##==============


###
# create individual deployment directory name and create it
###
dirpart=staging_$(date +%Y%m%d-%H%M%S)
dirname=/deploy/$dirpart
echo "staging to $dirname"
if [ -d $dirname ]
then
  echo "directory $dirname exists already"
  exit 1
fi
mkdir $dirname || (echo Problem creating directory; exit 2)

###
# copy files to the deployment directory
###
echo "copying files"
cp -R * $dirname
echo "adding version file"
echo -e "deploy date: $(date '+%Y-%m-%d, %H:%M:%S (%Z, %z)')\nsnapshot hash: $CI_COMMIT_SHA" >> $dirname/src/main/webapp/version.txt

###
# start ssh session and build docker
###
ssh deployer@gradoopwebctl.sc.uni-leipzig.de \
  echo 'deploying on $(hostname)...' "&&"\
  cd /home/deployer/deploy-volume/$dirpart "&&"\
  ./runOnDocker.sh "$CI_COMMIT_SHA"

# Think about using Docker WatchTower: https://github.com/v2tec/watchtower
