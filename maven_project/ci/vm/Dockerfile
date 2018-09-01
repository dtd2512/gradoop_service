FROM centos:7.3.1611

# update packages(again) and install openjdk + maven
# + openssh-clients (ssh tools for deployment)
RUN yum update -y &&\
  yum -y install java-1.8.0-openjdk-devel maven openssh-clients
  
RUN mkdir /deploy
