module.exports = {
    cwd: __dirname,
    extends: "@istanbuljs/nyc-config-typescript",
    include: ['**/src/**'],
    exclude: ['.vscode-test/**'],
    reporter: ['text', 'html'],
    all: true,
    instrument: true,
    hookRequire: true,
    hookRunInContext: true,
    hookRunInThisContext: true,
    sourceMap: true,
}
