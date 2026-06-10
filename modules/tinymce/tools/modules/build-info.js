const formatDate = (date) => date.toISOString().slice(0, 10);

const getBuildTag = () => process.env.TINYMCE_BUILD_TAG || 'security-fixes';

const getBuildDate = () => process.env.TINYMCE_BUILD_DATE || formatDate(new Date());

const getBuildVersion = (packageData) => {
  const buildNumber = process.env.BUILD_NUMBER ? '-' + process.env.BUILD_NUMBER : '';
  return packageData.version + '-' + getBuildTag() + buildNumber;
};

module.exports = {
  getBuildDate,
  getBuildVersion
};
