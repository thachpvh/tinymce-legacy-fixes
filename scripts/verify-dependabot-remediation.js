const fs = require('fs');
const path = require('path');

const lockfile = fs.readFileSync(path.join(__dirname, '..', 'yarn.lock'), 'utf8');

const minimumVersions = {
  'braces': '3.0.3',
  'dot-prop': '4.2.1',
  'form-data': '2.5.4',
  'json-schema': '0.4.0',
  'json5': '1.0.2',
  'lodash': '4.18.0',
  'node-forge': '1.4.0',
  'parse-path': '5.0.0',
  'parse-url': '8.1.0',
  'postcss': '8.5.10',
  'qs': '6.14.2',
  'rollup': '2.80.0',
  'send': '0.19.0',
  'serve-static': '1.16.0',
  'tar': '7.5.11',
  'tar-fs': '2.1.4',
  'tmp': '0.2.6',
  'tough-cookie': '4.1.3',
  'uuid': '11.1.1',
  'webpack-dev-middleware': '5.3.4',
  'webpack-dev-server': '5.2.4',
  'ws': '8.17.1'
};

const vulnerableVersionRules = {
  'ansi-regex': [
    { min: '3.0.0', max: '3.0.1' },
    { min: '4.0.0', max: '4.1.1' }
  ],
  'js-yaml': [
    { min: '0.0.0', max: '3.14.2' },
    { min: '4.0.0', max: '4.1.1' }
  ],
  'loader-utils': [
    { min: '0.0.0', max: '1.4.1' },
    { min: '2.0.0', max: '2.0.3' }
  ],
  'minimatch': [
    { min: '0.0.0', max: '3.1.3' },
    { min: '5.0.0', max: '5.1.8' },
    { min: '6.0.0', max: '6.2.2' }
  ]
};

const removedPackages = [
  'ip',
  'lodash.pick',
  'lodash.set',
  'request',
  'xmldom'
];

const blocks = lockfile.split(/\n(?=\S)/g);

const normalizeSelector = (selector) => selector.trim().replace(/^"|"$/g, '');

const selectorsForBlock = (block) => {
  const header = block.split('\n', 1)[0];
  const withoutColon = header.endsWith(':') ? header.slice(0, -1) : header;
  return withoutColon.split(/,\s*/).map(normalizeSelector);
};

const packageNameForSelector = (selector) => {
  if (selector.startsWith('@')) {
    return selector.split('@', 3).slice(0, 2).join('@');
  }

  return selector.split('@', 1)[0];
};

const versionForBlock = (block) => {
  const match = block.match(/\n\s+version "([^"]+)"/);
  return match ? match[1] : null;
};

const versionsForPackage = (packageName) => {
  const versions = new Set();

  for (const block of blocks) {
    const selectors = selectorsForBlock(block);
    if (selectors.some((selector) => packageNameForSelector(selector) === packageName)) {
      const version = versionForBlock(block);
      if (version) {
        versions.add(version);
      }
    }
  }

  return [...versions].sort(compareVersions);
};

const compareVersions = (left, right) => {
  const leftParts = left.split('.').map((part) => Number.parseInt(part, 10));
  const rightParts = right.split('.').map((part) => Number.parseInt(part, 10));
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index++) {
    const diff = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
};

const failures = [];

for (const [packageName, minimumVersion] of Object.entries(minimumVersions)) {
  const versions = versionsForPackage(packageName);
  const vulnerableVersions = versions.filter((version) => compareVersions(version, minimumVersion) < 0);

  if (vulnerableVersions.length > 0) {
    failures.push(`${packageName} resolves vulnerable versions ${vulnerableVersions.join(', ')}; expected >= ${minimumVersion}`);
  }
}

for (const [packageName, rules] of Object.entries(vulnerableVersionRules)) {
  const versions = versionsForPackage(packageName);
  const vulnerableVersions = versions.filter((version) => rules.some((rule) => {
    return compareVersions(version, rule.min) >= 0 && compareVersions(version, rule.max) < 0;
  }));

  if (vulnerableVersions.length > 0) {
    failures.push(`${packageName} resolves vulnerable versions ${vulnerableVersions.join(', ')}`);
  }
}

for (const packageName of removedPackages) {
  const versions = versionsForPackage(packageName);

  if (versions.length > 0) {
    failures.push(`${packageName} remains in yarn.lock at ${versions.join(', ')}; expected removal or replacement`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Dependabot remediation dependency checks passed.');
