const debug = require('debug')('meshblu-connector-left-right-http:Minimizer')
const bindAll = require('lodash/fp/bindAll')
const get = require('lodash/fp/get')
const isEmpty = require('lodash/fp/isEmpty')

class Minimizer {
  constructor({ child_process, device, meshbluFirehose, meshbluHttp }) {
    bindAll(Object.getOwnPropertyNames(Minimizer.prototype), this)

    if (!child_process) throw new Error('Missing required parameter: child_process') // eslint-disable-line camelcase
    if (!device) throw new Error('Missing required parameter: device')
    if (!meshbluFirehose) throw new Error('Missing required parameter: meshbluFirehose')
    if (!meshbluHttp) throw new Error('Missing required parameter: meshbluHttp')

    this.child_process = child_process // eslint-disable-line camelcase
    this.device = device
    this.meshbluFirehose = meshbluFirehose
    this.meshbluHttp = meshbluHttp
  }

  run(callback) {
    this.meshbluFirehose.on('message', this._onMessage)
    this._subscribeToSelfMessageReceived(callback)
  }

  _onMessage(message) {
    const action = get('data.data.action', message)
    const command = get(action, get('options.commands', this.device))
    if (isEmpty(command)) return

    debug('_onMessage', JSON.stringify({ action, command }, null, 2))
    this.child_process.exec(command)
  }

  _subscribeToSelfMessageReceived(callback) {
    this.meshbluHttp.createSubscription({
      subscriberUuid: this.device.uuid,
      emitterUuid: this.device.uuid,
      type: 'message.received',
    }, callback)
  }
}

module.exports = Minimizer
