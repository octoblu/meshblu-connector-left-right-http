const async = require('async')
const debug = require('debug')('meshblu-connector-left-right-http:Connector')
const bindAll = require('lodash/fp/bindAll')
const getOr = require('lodash/fp/getOr')

const Minimizer = require('./Minimizer')
const Rotator = require('./Rotator')

class Connector {
  constructor({ child_process, meshbluHttp, meshbluFirehose }) {
    bindAll(Object.getOwnPropertyNames(Connector.prototype), this)

    if (!child_process) throw new Error('Missing required parameter: child_process') // eslint-disable-line camelcase
    if (!meshbluFirehose) throw new Error('Missing required parameter: meshbluFirehose')
    if (!meshbluHttp) throw new Error('Missing required parameter: meshbluHttp')

    this.child_process = child_process // eslint-disable-line camelcase
    this.meshbluHttp = meshbluHttp
    this.meshbluFirehose = meshbluFirehose
  }

  run(callback) {
    debug('run')
    this.meshbluFirehose.connect()
    this.meshbluHttp.whoami((error, device) => {
      if (error) return callback

      async.parallel([
        async.apply(this._startMinimizer, device),
        async.apply(this._startRotator, device),
      ], callback)
    })
  }

  _startMinimizer(device, callback) {
    const { child_process, meshbluFirehose, meshbluHttp } = this
    const { commands } = getOr({}, 'leftRightOptions', device)
    const deviceId = device.uuid

    if (!commands) {
      debug('no commands found, skipping Minimizer')
      return callback()
    }

    const minimizer = new Minimizer({ child_process, commands, deviceId, meshbluFirehose, meshbluHttp })
    minimizer.run(callback)
  }

  _startRotator(device, callback) {
    const { buttonUrl, rotatorUrls } = getOr({}, 'leftRightOptions', device)

    if (!buttonUrl || !rotatorUrls) {
      debug('Could not find buttonUrl or rotatorUrls, skipping Rotator')
      return callback()
    }

    const rotator = new Rotator({ urls: rotatorUrls, websocketUrl: buttonUrl })
    rotator.run(callback)
  }
}

module.exports = Connector
