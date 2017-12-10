#!/usr/bin/env node
const path = require('path')
const exists = require('fs').existsSync
const program = require('commander')
const chalk = require('chalk')
const ora = require('ora')
const home = require('user-home')
const tildify = require('tildify')
const inquirer = require('inquirer')
const download = require('download-git-repo')
const checkVersion = require('../lib/check-version')
const logger = require('../lib/logger')
const localPath = require('../lib/local-path')

const isLocalPath = localPath.isLocalPath
const getTemplatePath = localPath.getTemplatePath

program
  .usage('<template-name> [project-name]')
  .option('-c --clone', 'use git clone')
  .option('--offline', 'use cached template')

program.on('--help', () => {
  console.log()
  console.log('  Example:')
  console.log()
  console.log(chalk.gray('   # create a new project with an official template'))
  console.log('  $ cwa init standard my-project')
  console.log()
  console.log(chalk.gray('   # create a new project straight from a github template'))
  console.log('  $ cwa init username/repo my-project')
  console.log()
})

function help () {
  program.parse(process.argv)
  if (program.args.length < 1) return program.help()
}
help()

let template = program.args[0]
const hasSlash = template.indexOf('/') > -1
const rawName = program.args[1]
const inPlace = !rawName || rawName === '.'
const name = inPlace ? path.relative('../', process.cwd()) : rawName
const to = path.resolve(rawName || '.')
const clone = program.clone || false
const offline = program.offline || false

/**
 * use offline cache
 */
const tmp = path.join(home, '.WePY-Templates', template.replace(/\//g, '-'))
if (offline) {
  console.log(`> Use cached template at ${chalk.yellow(tildify(tmp))}`)
  template = tmp
}

console.log()
process.on('exit', () => {
  console.log()
})

if (exists(to)) {
  inquirer.prompt([{
    type: 'confirm',
    message: inPlace
      ? 'Generate project in current directory?'
      : 'Target directory exists. Continue?',
    name: 'ok'
  }]).then(answers => {
    if (answers.ok) {
      run()
    }
  }).catch()
} else {
  run()
}

function run () {
  // check if template is local
  if (isLocalPath(template)) {
    const templatePath = getTemplatePath(template)
    if (exists(templatePath)) {
      generate(name, templatePath, to, err => {
        if (err) logger.fatal(err)
        console.log()
        logger.success('Generated "%s".', name)
      })
    } else {
      logger.fatal('Local template "%s" not found.', template)
    }
  } else {
    checkVersion(() => {
      if (!hasSlash) {
        // use official templates
        const officialTemplate = 'WePY-Templates/' + template
        if (template.indexOf('#') !== -1) {
          downloadAndGenerate(officialTemplate)
        } else {
          if (template.indexOf('-2.0') !== -1) {
            warnings.v2SuffixTemplatesDeprecated(template, inPlace ? '' : name)
            return
          }

          // warnings.v2BranchIsNowDefault(template, inPlace ? '' : name)
          downloadAndGenerate(officialTemplate)
        }
      } else {
        downloadAndGenerate(template)
      }
    })
  }
}

/**
 * Download a generate from a template repo.
 *
 * @param {String} template
 */

function downloadAndGenerate (template) {
  const spinner = ora('downloading template')
  spinner.start()
  // Remove if local template exists
  if (exists(tmp)) rm(tmp)
  download(template, tmp, { clone }, err => {
    spinner.stop()
    if (err) logger.fatal('Failed to download repo ' + template + ': ' + err.message.trim())
    generate(name, tmp, to, err => {
      if (err) logger.fatal(err)
      console.log()
      logger.success('Generated "%s".', name)
    })
  })
}