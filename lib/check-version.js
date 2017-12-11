const semver = require('semver')
const request = require('request')
const chalk = require('chalk')
const pkgConfig = require('../package.json')

module.exports = done => {
  /**
   * 检测当前node版本是否符合要求
   */
  if (!semver.satisfies(process.version, pkgConfig.engines.node)) {
    return console.log(chalk.red(
      '  You must upgrade node to >=' + pkgConfig.engines.node + '.x to use create-wepy-app'
    ))
  }
  request({
    url: 'https://registry.npmjs.org/create-wepy-app',
    timeout: 1000
  }, (err, res, body) => {
    if (!err && res.statusCode === 200) {
      const latestVersion = JSON.parse(body)['dist-tags'].latest
      const localVersion = pkgConfig.version
      if (semver.lt(localVersion, latestVersion)) {
        console.log(chalk.yellow('  A newer version of create-wepy-app is available.'))
        console.log()
        console.log('  latest:    ' + chalk.green(latestVersion))
        console.log('  installed: ' + chalk.red(localVersion))
        console.log()
      }
    }
    done()
  })
}