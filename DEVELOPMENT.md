# Development

## Publish

1. [Local] Checkout release branch: `git checkout v<version>` or `git checkout next/v<version>`
2. [Local] Run `npm run versionup` or `npm run versionup:prerelease`
   - Update CHANGELOG.md and `package.json`'s `version`, and `lerna.json`'s `version`
   - It does not git tag
3. [Local] Submit to Release Pull Request
4. [GitHub] Review Release Pull Request
5. [GitHub] Write Release Note into the Release Pull Request's body
6. [GitHub] Merge Release Pull Request
7. [CI] Create git tag && Create GitHub Release && publish to npm(GitHub Package Registry)
   - :memo: The GitHub Release's body is copied from Release Pull Request's body

## How to add a new package

For example, if you want to add a new package named `@ckb-lumos/omnilock`, you could do it in following steps.

1. Create a new directory named `omnilock` under `src/packages`. For convenience, you could simply copy `bi` package by running `cp -r bi omnilock` under the `src/packages` directory.

2. Edit `README.md` file. Put the basic introduction and examples of your package for your users.

3. Edit `name`, `version`, `description`, `author` infomation in `package.json`.

4. Edit `dependencies` filed in `package.json`. Warning: never put `@ckb-lumos/lumos` in you package's dependencies, it will cause circular dependencies and lead you to dependency hell. Only put specific packages of lumos that you have used in your package in the `package.json`, such as `"@ckb-lumos/base": "0.17.0"`, `"@ckb-lumos/hd": "0.17.0"`, `"@ckb-lumos/common-scripts": "0.17.0"`. Thus your package will not depend on `@ckb-lumos/lumos` which will include the package you are developing, in which case it will cause building problems.

5. Write your code in your packags's main file, for example, `packages/omnilock/src/index.ts`. In this main file, you will export classes, functions, types and interfaces that you think will be useful and easy to understand for your package's users. If you are not sure how to do this, you can refer to other packages' `src/index.ts` files. Try to start small by exporting a function that does `console.log('hello')`.

6. Build your package locally. After you have exported some classes or functions in `src/index.ts`, you should go to the root of `lumos` repo, run:
```
yarn
yarn build
yarn build-release
```

You probably will encounter many code errors when building, try to search for answsers. If you don't know how to solve them, you could ask lumos developers in the community, email lumos developers or create an issue in GitHub's lumos repository.

If you build it successfully, congratulations! Now you could find a `lib/` directory in your package's directory, it will contain built files like `index.d.ts`, `index.js`, `index.js.map`.

7. Import and use your package. Try to create a typescript script in `examples/` directory, for examples, `transferCKB.ts`, in this file, import your classes, functions, interfaces or types from your own package and then use them in the script to do something.

8. Run the script that has used your package. To run `.ts` file, you could use `ts-node`. Install it by running `npm install -g ts-node`(you could also install it in your local directory). Now you could run your typescript script using `ts-node transferCKB.ts`. If ther are some errors, try to fix it. Also, if you find it difficult, try to contact lumos developers or create an issue.

9. Write some formal tests. If you have run the script successfully, then you could try to write some tests that imports your pacakge's classes, functions, interfacdes and types. Both test and example can tell user how to use your package in real situation. If you do not know how to write test, please check the `test/` directory in other packages, the format is universal and quite clear, you would understand it soon.
 
10. Make a pull request and ask for review. If you publish your packagge to the NPM package management platorm, it will effect real world applications using lumos. So we advise you make a pull request on GitHub and ask for other lumos developer to review and test your package. It will be safer for your users.