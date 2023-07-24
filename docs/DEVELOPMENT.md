# DEVELOPMENT

## Changeset Workflow

Lumos is released using [changesets cli](https://github.com/changesets/changesets) and
[changesets action](https://github.com/changesets/action).

```mermaid
sequenceDiagram
    actor admin as Admin
    actor dev as Contributor
    participant repo as Repo
    participant bot_pr as Bot PR

    alt prerelease
        admin ->> repo: changeset pre enter next
    else latest
        admin ->> repo: changeset pre exit
    end

    par
        dev ->> repo: changeset add
        repo ->> bot_pr: changeset update
    end

    admin ->> bot_pr: approve
    dev ->> bot_pr: approve
    bot_pr ->> repo: changeset merge
```

## To Admin

### Start New Prerelease Cycle

```sh
npx changeset pre enter next
```

### End Prerelease Cycle

```sh
npx changeset pre exit
```

A pull request titled **"Version Packages"** or **"Version Packages (next)"** will be automatically created by the bot after the above command's commit has been pushed to the `develop` branch.

## To Contributor

### Add Changeset

You can add one or more changesets when you open a pull request. Before `lumos@1.x` is released, you should treat a `minor` change as a `major` change.

### Add Changeset

When a change has been made, you can add a changeset by running the following command:

```sh
npx changeset add
```
