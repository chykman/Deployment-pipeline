# Senior DevOps / Cloud Engineering Roadmap

One project, eleven tasks. Each task adds a technology, a failure mode to survive, and a **system design question** to answer in writing. Do them in order: every task assumes the previous one is finished and its checklist is ticked.

**How to work each task**
1. Read the brief in `docs/tasks/NN-*.md`.
2. Do the hands-on steps yourself in a branch and open a pull request.
3. Break something on purpose and fix it. This is where most of the learning happens.
4. Write the ADR and the system design answer.
5. Update the architecture snapshot in `docs/architecture/` (a new numbered file, never edit an old one).
6. Tick the box below and tell Claude: it will review your work and unlock the next task.

**Constraints**: a laptop VM (8 GB RAM, 6 CPUs), a corporate network, a public GitHub repo. Cloud tasks (9 onwards) use free tiers and always end with a teardown step and a billing alert.

## Phase 1: Delivery pipeline

| # | Task | New technology | Failure mode you learn to handle | System design thread |
|---|------|----------------|----------------------------------|----------------------|
| [ ] 1 | **CI quality gates** | GitHub-hosted CI, integration tests, hadolint, actionlint, Trivy, branch protection | Bad code or a vulnerable image reaching `main` | Where do checks belong in a delivery pipeline (shift-left)? Trust boundaries between CI and CD |
| [ ] 2 | **Release engineering** | GHCR registry, immutable SHA tags, GitHub Environments, rollback workflow, blue/green with nginx | A bad release at 2 a.m.: how fast can you undo it? | Deploy strategies compared: recreate, rolling, blue/green, canary |
| [ ] 3 | **Observability** | Prometheus, Grafana, Loki, node-exporter, cAdvisor, Alertmanager | Not knowing the app is slow or down until a user tells you | Design a monitoring system: metrics vs logs vs traces, RED/USE, SLIs/SLOs, alert fatigue |

## Phase 2: Infrastructure as code and security

| # | Task | New technology | Failure mode | System design thread |
|---|------|----------------|--------------|----------------------|
| [ ] 4 | **Configuration as code** | Ansible roles, handlers, vault; replace the inline Vagrant script | Snowflake servers: nobody can rebuild the VM | Idempotency, desired-state vs imperative, drift |
| [ ] 5 | **Secrets and hardening** | SOPS + age, SSH/ufw/fail2ban hardening, image signing (cosign), SBOMs, Dependabot | Leaked credential, compromised dependency | Threat modelling (STRIDE) for this system; least privilege |

## Phase 3: Orchestration

| # | Task | New technology | Failure mode | System design thread |
|---|------|----------------|--------------|----------------------|
| [ ] 6 | **Kubernetes fundamentals** | k3s, Deployments, Services, Ingress, probes, requests/limits, HPA, Helm | Pods crash-looping, noisy neighbours, bad rollouts | Scheduling, service discovery, horizontal scaling of stateless tiers |
| [ ] 7 | **GitOps and progressive delivery** | Argo CD, Kustomize overlays (dev/prod), Argo Rollouts canary | Config drift between Git and the cluster | Pull vs push deploys, environments and promotion |
| [ ] 8 | **Stateful systems and disaster recovery** | PVCs, PostgreSQL backups with WAL archiving, restore drills | Data loss, corrupted volume | RPO/RTO, replication, backups vs HA, CAP trade-offs |

## Phase 4: Cloud and scale

| # | Task | New technology | Failure mode | System design thread |
|---|------|----------------|--------------|----------------------|
| [ ] 9 | **Cloud foundations** | Terraform (modules, remote state), AWS VPC, ECS Fargate or EKS, RDS, ALB, ACM, OIDC from GitHub | Click-ops drift, surprise bills, long-lived keys | Multi-AZ networks, public/private subnets, cost modelling |
| [ ] 10 | **Reliability engineering** | k6 load tests, autoscaling, chaos experiments, SLO burn-rate alerts, postmortems | Traffic spikes, partial outages, cascading failure | Caching, rate limiting, backpressure, capacity planning |
| [ ] 11 | **Platform engineering** | Policy as code (Kyverno/OPA), service mesh mTLS (Linkerd), multi-env promotion, a self-service template | Inconsistent teams and environments | Multi-tenancy, golden paths, build vs buy |

## Cross-cutting habits (every task)
- **ADR**: one short Architecture Decision Record per task in `docs/adr/` (template provided).
- **Runbook**: how to deploy, roll back and debug what you just built, in `docs/runbooks/`.
- **Cost note**: what would this cost per month in the cloud, and how would you cut it?
- **Interview drill**: answer the brief's questions out loud in two minutes each.
