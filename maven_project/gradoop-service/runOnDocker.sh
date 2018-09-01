#!/bin/bash
##==============
## build a docker image 'scads/gradoop-service' and restart/run it as docker container 'gradoop-service'.
## As a `docker restart` seems to negleckt an image update we do it manually.
## As removing a docker container can take longer than the docker stop command (with imlicit removal), we prefer rename + stop + start.
## The check for existing containers hits if our container name is a substring of the existing container name
##   and our image name is a substring of docker result text.
##==============


## set variables
if [[ "$1" =~ ^[[:alnum:]]+$ ]]; then
  GradoopDockerRun_TagSuffix="-$1"
else
  echo "invalid parameter \""$1"\" as a tag suffix. Skipping it."
fi

GradoopDocker_ImageName="scads/gradoop-service"
GradoopDocker_ImageDateTag="$(date +%Y%m%d-%H%M%S)"
GradoopDocker_ImageName_Full="${GradoopDocker_ImageName}:${GradoopDocker_ImageDateTag}${GradoopDockerRun_TagSuffix}"
GradoopDocker_ImageName_Old="${GradoopDocker_ImageName}:old"
GradoopDocker_ImageName_Latest="${GradoopDocker_ImageName}:latest"
GradoopDocker_ContainerName="gradoop-service"
GradoopDocker_ContainerOldName="gradoop-old"

echo "script variables used:"
set | grep "^GradoopDocker_"

echo "check for old docker image ... ($(date))"
GradoopDockerRun_ImageLatestCount=$(docker images --filter "reference=$GradoopDocker_ImageName_Latest" --quiet | wc -l)
echo "...done (check old image)"


## build image
echo "building docker image ... ($(date))"
if docker build --tag "$GradoopDocker_ImageName_Full" ./ ; then
  echo "...done(build) ($(date))"


## manage image tags
  if [ $GradoopDockerRun_ImageLatestCount -ge 1 ] ; then
    echo "retag old gradoop docker image... ($(date))"
    docker image tag "$GradoopDocker_ImageName_Latest" "$GradoopDocker_ImageName_Old"
    echo "done (retag old image) ($(date))"
  fi 
  
  echo "tag gradoop docker image as 'latest'"
  docker image tag "$GradoopDocker_ImageName_Full" "$GradoopDocker_ImageName_Latest"
  echo "done (tag image)"


## manage old container
  echo "check for old container copy"
  if docker ps --filter "name=$GradoopDocker_ContainerOldName" | grep -F "$GradoopDocker_ImageName" ; then
    echo "removing old gradoop docker container copy..."
    docker rm "$GradoopDocker_ContainerOldName"
    echo "...done(remove container copy)"
  else
    echo "no old container found"
  fi


  echo "check for current container"
  if docker ps --filter "name=$GradoopDocker_ContainerName" | grep -F "$GradoopDocker_ImageName" ; then
    echo "renaming current gradoop docker container..."
    docker rename "$GradoopDocker_ContainerName" "$GradoopDocker_ContainerOldName"
    echo "...done(rename current container)"

    date
    echo "stopping current gradoop docker container ...($(date))"
    docker stop "$GradoopDocker_ContainerOldName"
    echo "...done(stop current container)"
  else
    echo "no current container found"
  fi

  echo "2nd check for current container (to be sure)"
  if docker ps --filter "name=$GradoopDocker_ContainerName" | grep -F "$GradoopDocker_ImageName" ; then
    echo "current container still present, stoping it...($(date))"
    docker stop "$GradoopDocker_ContainerName"
    echo "...done(stop current container 2)"

    echo "wait to make sure everything works with docker"
    sleep 10

    echo "removing current container (to be sure)...($date))"
    docker rm "$GradoopDocker_ContainerName"
    echo "...done(remove current container 2)"

    echo "wait to make sure everything works with docker"
    sleep 10
  fi

## start new container 
  echo "starting the new gradoop container ...($(date))"
  GradoopDocker_Status="WARNING"
  if docker run -di --rm -p 8080:2342 --name "$GradoopDocker_ContainerName" "$GradoopDocker_ImageName_Full" ; then
    echo "...done(start new container) ($(date))"
    GradoopDocker_Status="OK"

    ## remove old images on success
    echo "removing older images... ($(date))"
    docker rmi $(docker images --filter "reference=$GradoopDocker_ImageName" --filter "before=$GradoopDocker_ImageName_Old" --quiet)
    echo "...done (removing older images... ($(date))"

    #echo "cleaning up dangling images... ($(date))"
    #docker image prune -f && \
    #echo "...done (cleaning images) ($(date))"
  else
    echo "current docker containers"
    docker ps -a
    echo "WARNING: something seems to have went wrong with starting the container. Please Check! ($(date))"
  fi

## print summary
  echo "script variables used"
  set | grep "^GradoopDocker_"
  echo "gradoop docker images:"
  docker images --filter "reference=$GradoopDocker_ImageName"
  echo "gradoop docker containers currently running:"
  docker ps --filter "name=$GradoopDocker_ContainerName"

  echo
  echo "---------------------------"
  echo "# container status: $GradoopDocker_Status"
  echo "---------------------------"
  echo "done (script). Status: $GradoopDocker_Status. ($(date))"
fi
