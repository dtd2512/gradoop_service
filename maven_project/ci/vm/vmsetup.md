# steps for setup the deploy vm
* check firewall and hostname
  * firewalld configuration
     * set zone configuration in `/etc/firewalld/zones/galaxy.xml`
     * create service definitions for `webclients.xml` and `sshclients.xml` in `/etc/firewalld/services/`
     * adjust in `/etc/firewalld/firewalld.conf` `DefaultZone=scads`.

  * adjust hostname: `hostnamectl set-hostname <new hostname>` **or**
     * insert in `/etc/sysconfig/network`
      `HOSTNAME=gradoopwebctl.sc.uni-leipzig.de`
     * adjust `etc/hosts` like
```
  127.0.0.1   gradoopwebctl gradoopwebctl.sc.uni-leipzig.de
  ::1       gradoopwebctl gradoopwebctl.sc.uni-leipzig.de
```
     * call `$ sudo hostname gradoopwebctl.sc.uni-leipzig.de`
     * restart network: `$ sudo systemctl restart network`
     * reboot host: `$ sudo reboot`

* install puppet agent
  * sources:
     * https://docs.puppet.com/puppet/5.0/install_linux.html
     * https://www.digitalocean.com/community/tutorials/how-to-install-puppet-in-standalone-mode-on-centos-7
  * installation steps:
     * install puppet repo: `$ sudo rpm -Uvh https://yum.puppetlabs.com/puppet5/puppet5-release-el-7.noarch.rpm`
     * install puppet-agent: `$ sudo yum install puppet-agent`
     * test (in new shell): `$ puppet --version`, `$ facter | grep hostname`, `$ facter | grep fqdn`
     * get puppet modules
  * Docker-Modul: `sudo -i puppet module install garethr-docker --version 5.3.0`
  * Manifest-Datei anlegen (Inhalt siehe unten) als ` /etc/puppetlabs/code/environments/production/manifests/install.pp`
  * Puppet-Aufruf auf Puppet-Manifest mit `$ sudo -i puppet apply /etc/puppetlabs/code/environments/production/manifests/install.pp` /etc/puppetlabs/puppet/manifests`
* install basic software (git)
* install and register gitlab-Runner
  * docs:
     * https://docs.gitlab.com/runner/install/linux-repository.html
  * install repo: `$ sudo id` und `$ curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-ci-multi-runner/script.rpm.sh | sudo bash`
  * install Runner: `$ sudo yum install gitlab-ci-multi-runner`
  * check Runner: `$ sudo gitlab-runner status`
  * register Runner: `$ sudo gitlab-runner register`
     * enter *gitlab url* and *runner token* from gitlab -> << your project >> -> projects settings -> Pipelines
     * tags: *<< empty >>*
     * lock to current project: *true*
     * Runner executor: *docker*
     * default docker image: *centos:latest*
  * adjust docker runner to allow local images and volume mount. check the following lines are present in the "runners.docker" section in the file `/etc/gitlab-runner/config.toml`: 
     * `pull_policy = "if-not-present"`
     * `volumes = ["/cache", "/home/deployer/deploy-volume:/deploy"]`
* build docker image
  * call in the directory with the Dockerfile from git `docker build --tag scads/gradoop-service-ci ./`

## Deployment
Continuous deployment with Gitlab seems to be documented only with file copying.
### Option 1: build Docker image from application and run it
Problems:
* docker build is only possible in docker gitlab executor with docker-in-docker. New problems and security risks. https://docs.gitlab.com/ce/ci/docker/using_docker_build.html
* usage of shell gitlab executor does not offer good security and reproducability
* Open Problem of automatic restart of app container after new application image is created

### Option 2: export application to mounted external volume and programm automatic application restart
Problems:
* minor security problem: the docker executor does support volume mounts only for all images.
* no solution for automatic restart found yet
* docker volumes should be used with synchronized user ids

### Sources
* https://docs.gitlab.com/ee/ci/ssh_keys/README.html
* https://git.informatik.uni-leipzig.de/help/ci/environments

### Requirements


## Files
content of `/etc/puppetlabs/code/environments/production/manifests/install.pp`:
```
node "gradoopwebctl.sc.uni-leipzig.de" {

  # install docker from official repository using docker module from forge
  class { 'docker':
    manage_kernel => false,
  }

  # install oracle java 8 using official java puppet module
  java::oracle { 'jdk8' :
    ensure  => 'present',
    version => '8',
    java_se => 'jdk',
  }

  # install epel repo and some more software
  package { 'epel-release': ensure => 'installed' }
  $packagelist = ['htop', 'tmux', 'vim', 'git']
  package { $packagelist: ensure => 'installed' }

###
# init deployment configuration
###
  # create deploy and run users
  user { 'deployer':
    ensure         => 'present',
    managehome     => true,
    home           => "/home/deployer",
    gid            => 'nobody',
    purge_ssh_keys => true,
  }
  ssh_authorized_key { 'deployer@gradoopwebctl.sc.uni-leipzig.de':
    ensure  => 'present',
    user    => 'deployer',
    type    => 'ssh-rsa',
    options => 'from="172.30.0.0/16"',
    key     => 'AAAAB3NzaC1yc2EAAAADAQABAAABAQCpE0ym1LTKnKTG7dSXf0x6m7OUDKV496TFQCLueDrT3FgwTLFCmyxJkUOGgQnJo7aVzWrHnZdp5/yQ1s+ZMrRF/r/aKvGnjFfQGE8ChoUrj9Xrj6uYPDAosle61GX3CE8vchH2cT/tYi7NxK0/8MIWG4aZbW/81F9unxFzbXCyg4EFnZXNjjqK8AQo6WXvW0a0DSx4WdnzlR1WfFFw16jejEfFBsZilXK5O6MyG9fo8pGSA6n+kuqxyF9UkJUnf/t+VvWOSJY/+a13Mvl9PDaOzZJ3uvBlyMg7yAgo4rUapec2+K0PldCcWgE4VM/fPdrRGQbmoiJd+MjyPqd/6BA3',
  }

  # create deploy directory
  file { '/home/deployer/deploy-volume':
    ensure => 'directory',
    owner  => 'deployer',
  }

} # End node
```
