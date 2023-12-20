# Devtools

## Mock Publication

If the release workflow is changed, it is important to test the new workflow. This can be done by publishing to a local registry. The following steps will setup a local registry and configure npm to use it.

```sh
npm install -g verdaccio
verdaccio --config ./devtools/verdaccio.yaml --listen=4873
npm config set registry http://localhost:4873
npm config set //localhost:4873/:_authToken fake
```

To test the release workflow on GitHub, the following step can be added to the workflow file.

```yaml
# TODO remove me when ready
- name: Release to Verdaccio
  run: |
    npm install -g verdaccio
    npm config set registry http://localhost:4873
    npm config set //localhost:4873/:_authToken fake
    nohup verdaccio --config ./devtools/verdaccio.yaml --listen=4873 >/dev/null 2>&1 &
```
