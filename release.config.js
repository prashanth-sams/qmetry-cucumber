const config = {
    branches: ['master'],
    plugins: [
        '@semantic-release/commit-analyzer',
        '@semantic-release/release-notes-generator',
        ["@semantic-release/changelog", {
            "changelogFile": "CHANGELOG.md"
          }],
        '@semantic-release/github',
        ['@semantic-release/git', {
            assets: ['dist/*', 'package.json', 'LICENSE', 'README.md'],
            message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
        }]
    ]
};

module.exports = config;