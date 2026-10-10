# -*- mode: ruby -*-
# Ubuntu 22.04 VM with Docker Engine + Compose plugin, ready for a
# GitHub Actions self-hosted runner. All provisioning is inline below.
# Idempotent: safe to re-run with `vagrant provision`.

$provision = <<-'SCRIPT'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "==> Base packages"
apt-get update -y
apt-get install -y ca-certificates curl gnupg git jq tar unzip lsb-release

echo "==> Docker official apt repo"
install -m 0755 -d /etc/apt/keyrings
if [ ! -s /etc/apt/keyrings/docker.asc ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
fi
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

echo "==> Docker Engine + Compose plugin"
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

echo "==> Dedicated runner user (no sudo, in docker group)"
id runner >/dev/null 2>&1 || useradd -m -s /bin/bash runner
usermod -aG docker runner
usermod -aG docker vagrant

echo "==> Runner directory"
install -d -o runner -g runner /opt/actions-runner

echo "==> Done"
docker --version
docker compose version
SCRIPT

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"          # Ubuntu 22.04 LTS
  config.vm.box_check_update = false
  config.vm.hostname = "deploy-vm"
  config.vm.boot_timeout = 1200

  # Host-only network: reach the VM from your machine at 192.168.56.10.
  # (The default NAT adapter still gives the VM outbound internet.)
  config.vm.network "private_network", ip: "192.168.56.10"

  # Not needed: the runner checks out the repo itself.
  # Default /vagrant share stays off; we mount the project at a path of our choosing.
  config.vm.synced_folder ".", "/vagrant", disabled: true

  # Share this Windows folder into the VM at /vagrant-vms/Pipeline.
  # Needs VirtualBox Guest Additions in the guest. The box doesn't ship them, so
  # install the plugin once on the host:  vagrant plugin install vagrant-vbguest
  config.vm.synced_folder ".", "/vagrant-vms/Pipeline",
    type: "virtualbox", owner: "vagrant", group: "vagrant"
  if Vagrant.has_plugin?("vagrant-vbguest")
    config.vbguest.auto_update = true
  end


  config.vm.provider "virtualbox" do |vb|
    # vb.name removed: renaming the VM folder fails on this machine (VERR_FILE_NOT_FOUND)
    vb.cpus = 6
    vb.memory = "8192"
  end

  config.vm.provision "shell", name: "docker-and-runner-prereqs", inline: $provision
end
