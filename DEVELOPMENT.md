# Development

## Publish

1. [Local] Checkout release branch: `git checkout v<version>` or `git checkout next/v<version>`
2. [Local] Run `yarn run versionup` or `yarn run versionup:prerelease`
   - Update CHANGELOG.md and `package.json`'s `version`, and `lerna.json`'s `version`
   - It does not git tag
3. [Local] Submit to Release Pull Request
4. [GitHub] Review Release Pull Request
5. [GitHub] Write Release Note into the Release Pull Request's body
6. [GitHub] Merge Release Pull Request
7. [CI] Create git tag && Create GitHub Release && publish to npm(GitHub Package Registry)
   - :memo: The GitHub Release's body is copied from Release Pull Request's body
