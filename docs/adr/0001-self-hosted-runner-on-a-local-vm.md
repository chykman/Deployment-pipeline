# ADR-0001: Deploy through a self-hosted runner on a local Vagrant VM

- **Status:** accepted
- **Date:** 2026-10-10

## Context
We want push-to-deploy onto a VM on a laptop. The VM sits behind NAT with no public address, so GitHub cannot reach it.

## Options considered
1. **SSH deploy from GitHub-hosted runners:** needs the VM to be reachable from the internet (port forwarding or a tunnel) and an SSH key stored as a secret.
2. **Self-hosted runner on the VM:** the runner only makes outbound HTTPS calls to GitHub, so no inbound access is needed.
3. **Pull-based agent (e.g. Watchtower, later Argo CD):** the VM polls a registry or Git for changes.

## Decision
Option 2. It is the simplest thing that works behind NAT and teaches how runners authenticate.

## Consequences
- Workflow code runs on our VM with access to Docker, so **untrusted code (fork PRs) must never run on it.** CI for pull requests uses GitHub-hosted runners.
- The VM is a single point of failure for deploys.
- Revisit when we move to Kubernetes: a pull-based GitOps model (Argo CD) removes the need for deploy credentials on the runner.
