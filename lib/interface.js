module.exports = function getUserArguments() {
  const userArgs = process.argv.slice(2)
  return userArgs[0]
}
