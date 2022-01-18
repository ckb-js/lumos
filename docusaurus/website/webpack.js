module.exports = function (context, options) {
    return {
        name: 'custom-docusaurus-plugin',
        configureWebpack(config, isServer, utils) {
            const { getCacheLoader } = utils;
            return {
                resolve: {
                    fallback: {
                        "fs": false,
                        "tls": false,
                        "net": false,
                        "path": false,
                        "zlib": false,
                        "http": false,
                        "https": false,
                        "stream": false,
                        "crypto": false,
                    }
                },
            };
        },
    };
};