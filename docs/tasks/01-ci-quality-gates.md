# Task 1: CI quality gates

**Goal:** nothing reaches `main` (and therefore production) unless it has been tested, linted and scanned. You will move from "push to main and hope" to a pull-request workflow where `main` is protected.

**Already done for you** (read every line, because you must be able to explain it):
- `api/app.js` is split from `api/server.js` so the app can be tested without starting the process (dependency injection).
- `api/test/api.test.js` has 5 integration tests against a real PostgreSQL (no mocks). Run them in the VM without installing Node, using containers only:
  ```bash
  docker network create testnet
  docker run -d --name pgtest --network testnet -e POSTGRES_USER=app -e POSTGRES_PASSWORD=x -e POSTGRES_DB=app postgres:16-alpine
  sleep 5
  docker run --rm --network testnet -v "$PWD/api":/app -w /app \
    -e PGHOST=pgtest -e PGUSER=app -e PGPASSWORD=x -e PGDATABASE=app \
    node:22-alpine sh -c "npm ci && npm test"
  docker rm -f pgtest && docker network rm testnet
  ```
- `.github/workflows/ci.yml` runs three jobs on GitHub-hosted runners: **lint** (hadolint, actionlint, compose validation), **test** (Postgres service container, `npm test`, `npm audit`), **build-and-scan** (build both images, Trivy scan for fixable HIGH/CRITICAL CVEs).

## Your hands-on steps
1. **Branch and PR.** Create a branch `ci/quality-gates`, commit these files, push, and open a pull request into `main`. Watch the three CI jobs in the PR's Checks tab.
2. **Fix what CI finds.** The first run may flag lint warnings or a pinned action version that no longer exists. Read the log, fix it, push again. (Real pipelines are rarely green first time.)
3. **Break it on purpose, three ways**, each on its own branch and PR:
   - Make a test fail (change an expected status code). Confirm the PR is blocked from merging.
   - Change `api/Dockerfile` to `FROM node:16-alpine`. Observe Trivy fail. Note which CVEs it reports and why `--ignore-unfixed` matters.
   - Add a typo to a workflow file. Observe actionlint catch it.
4. **Protect `main`.** In the repo go to **Settings → Rules → Rulesets** (or Branches → Branch protection rule) and require: a pull request before merging, and the status checks `lint`, `test` and `build-and-scan` to pass. Then try to push straight to `main` and read the rejection.
5. **Lock down forks.** Settings → Actions → General → "Fork pull request workflows": require approval for all outside collaborators. Explain in your ADR why this matters for a self-hosted runner.
6. **Write ADR-0002** (`docs/adr/0002-ci-on-github-hosted-runners.md`): why PR checks run on GitHub-hosted runners and deploys on the self-hosted one. Use `docs/adr/0000-template.md`.

## Concepts to understand (be able to explain each in 2 minutes)
- CI vs continuous delivery vs continuous deployment.
- Shift-left: why a failure found in a PR is cheaper than one found in production.
- Why integration tests against a real database catch bugs that mocks hide, and what they cost (speed, flakiness).
- What a CVE scanner can and cannot tell you (false positives, unfixable findings, base image choice).
- A *trust boundary*: why untrusted PR code must never run where deploy credentials live.

## System design exercise (write 1 page in `docs/design/01-pipeline-trust.md`)
Draw the path from a developer's laptop to production. Mark every trust boundary and say what an attacker who controls a pull request could reach at each step. Then answer: *how would this design change for a team of 50 with 20 services?* (Think shared runners, caching, required reviews, CODEOWNERS.)

## Definition of done
- [ ] CI green on a PR; you can explain each job.
- [ ] You have seen all three deliberate failures block a merge.
- [ ] `main` is protected; a direct push is rejected.
- [ ] Fork-PR approval enabled.
- [ ] ADR-0002 and the design page committed.
- [ ] You can answer the interview drill below without notes.

## Interview drill
1. What is the difference between a unit test, an integration test and an end-to-end test? Which did we write, and why?
2. A scan reports a HIGH CVE in the base image with no fix available. What do you do?
3. Why is `npm ci` preferred over `npm install` in CI?
4. How would you speed up a CI pipeline that takes 20 minutes?
5. Why are secrets not available to workflows triggered by pull requests from forks?
