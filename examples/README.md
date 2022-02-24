# Lumos Examples

## Quick Start

### Build lumos

```sh
git clone https://github.com/nervosnetwork/lumos.git
cd lumos
yarn
yarn build
yarn build-release
```

### Check if the build is working

```
yarn ts-node examples/config-manager.ts
```

## Online Preview

Using [GitHubBox.com](https://codesandbox.io/docs/importing#using-githubboxcom), you can preview and interact with example code online through codesandbox.

For example:  
Change the GitHub URL: https://github.com/nervosnetwork/lumos/tree/develop/examples/omni-lock-metamask  
To: https://githubbox.com/nervosnetwork/lumos/tree/develop/examples/omni-lock-metamask

Note that due to the incompatibility of namiwallet and iframe, you need to open the result in a new window while opening [cardano-lock-namiwallet](https://github.com/nervosnetwork/lumos/tree/develop/examples/cardano-lock-namiwallet) with codesandbox.
