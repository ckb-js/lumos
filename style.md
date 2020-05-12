# Lumos code styles

This is not something that is as complete as a [formal Style Guide](https://google.github.io/styleguide/jsguide.html). We might get there one day but for now this is just some initial points for us to organize our code better.

## General Ideas

* Lumos will be tested and supported on the latest stable version of node.js, as well as all LTS versions since node.js 12.
* Lumos will be tested and supported on 64-bit machines running latest versions of Windows, macOS and popular Linux distributions(we might expand on this later).
* For dapp developers that are just using lumos as an npm dependency, Rust shall not be used, meaning pre-built binaries for the corresponding environment can be downloaded.
* Lumos is only designed to work with node.js environment, meaning browser is not a supported target.
* Lumos will provide TypeScript support, but all components of lumos should also support safe use from a pure JavaScript based environment. One example of this rule, is that all the components shall perform type checks dynamically within JavaScript, no TypeScript checking will be relied on for security.

## Rust Specific Part

* All Rust code should be compiled without warnings by the latest stable version of Rust.
* All Rust code should be formatted via the latest stable version of cargofmt.
* All Rust code should be checked by the latest stable version of clippy.
* As mentioned above, all components using Rust code shall provide pre-built binaries. See [indexer](https://github.com/nervosnetwork/lumos/tree/master/packages/indexer) for an example.

## JavaScript/TypeScript Specific Part

* All hand-written JavaScript, TypeScript, JSON files will be checked by [prettier](https://prettier.io/).
* JavaScript and TypeScript are both allowed, but when using JavaScript code, TypeScript typing definitions must be provided.
* The code must not rely on TypeScript type checking for securities. All types should be dynamically checked, even when using TypeScript.
* All public APIs shall have doc comments attached.
