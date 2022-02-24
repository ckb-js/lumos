# Development

## Publish

0. [Local] Checkout release branch: `git checkout release/<uniq>`
1. [Local] Run `yarn run versionup`
   - Update CHANGELOG.md and `package.json`'s `version`, and `lerna.json`'s `version`
   - It does not git tag
2. [Local] Submit to Release Pull Request
3. [GitHub] Review Release Pull Request
4. [GitHub] Write Release Note into the Release Pull Request's body
5. [GitHub] Merge Release Pull Request
6. [CI] Create git tag && Create GitHub Release && publish to npm(GitHub Package Registry)
   - :memo: The GitHub Release's body is copied from Release Pull Request's body
