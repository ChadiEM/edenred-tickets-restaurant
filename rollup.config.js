const nodeResolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");
const terser = require("@rollup/plugin-terser");

module.exports = {
    input: "edenred.js",
    output: {
        dir: "dist",
        format: "cjs",
        compact: true,
    },
    plugins: [
        nodeResolve(),
        commonjs({ strictRequires: true }),
        json(),
        terser({ format: { comments: false } }),
    ],
};
