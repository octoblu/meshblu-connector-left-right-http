const async = require('async')
const bindAll = require('lodash/fp/bindAll')

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
    const { child_process, meshbluFirehose, meshbluHttp } = this

    meshbluFirehose.connect()
    meshbluHttp.whoami((error, device) => {
      if (error) return callback

      const minimizer = new Minimizer({ child_process, device, meshbluFirehose, meshbluHttp })
      const rotator = new Rotator({ device, meshbluFirehose, meshbluHttp })

      async.parallel([
        minimizer.run,
        rotator.run,
      ], callback)
    })
  }
}

module.exports = Connector
