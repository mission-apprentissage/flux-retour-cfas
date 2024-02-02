module.exports = {
  branches: ["master", { name: "hotfix", channel: "hotfix", prerelease: "hotfix" }],
  repositoryUrl: "https://github.com/mission-apprentissage/flux-retour-cfas.git",
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/exec",
      {
        prepareCmd: `.bin/mna-tdb release:app \${nextRelease.version} push`,
      },
    ],
    [
      "@semantic-release/github",
      {
        // Do not comment to prevent useless notifications
        successComment: false,
        failComment: false,
        releasedLabels: false,
      },
    ],
    [
      "semantic-release-slack-bot",
      {
        notifyOnSuccess: true,
        notifyOnFail: true,
        markdownReleaseNotes: true,
      },
    ],
  ],
};
