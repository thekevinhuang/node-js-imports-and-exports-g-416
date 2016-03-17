module.exports = function getUserArgument() {
  const userArgs = process.argv.slice(2);

  if (userArgs.length > 1) {
    console.warn(`Warning: you provided more than one argument.`);
  }

  return userArgs[0];
};
