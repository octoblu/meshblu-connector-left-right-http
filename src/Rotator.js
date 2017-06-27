const async = require('async')
const debug = require('debug')('meshblu-connector-left-right-http:Rotator')
const bindAll = require('lodash/fp/bindAll')
const get = require('lodash/fp/get')
const isEmpty = require('lodash/fp/isEmpty')
const request = require('request')

const PATHS = {
  rotateLeft: '/previous',
  rotateRight: '/next',
}

class Rotator {
  constructor({ device, meshbluFirehose, meshbluHttp }) {
    bindAll(Object.getOwnPropertyNames(Rotator.prototype), this)

    if (!device) throw new Error('Missing required parameter: device')
    if (!meshbluFirehose) throw new Error('Missing required parameter: meshbluFirehose')
    if (!meshbluHttp) throw new Error('Missing required parameter: meshbluHttp')

    this.device = device
    this.meshbluFirehose = meshbluFirehose
    this.meshbluHttp = meshbluHttp
  }

  run(callback) {
    this.meshbluFirehose.on('message', this._onMessage)
    async.parallel([
      this._subscribeToButton,
      this._subscribeToSelfBroadcastReceived,
    ], callback)
  }

  _onMessage(message) {
    const action = get('data.data.action', message)
    const uri = PATHS[action]
    const baseUrl = get('options.apiURL', this.device)

    if (isEmpty(uri)) return
    debug('_onMessage', JSON.stringify({ action, baseUrl, uri }, null, 2))
    request.post({ baseUrl, uri })
  }

  _subscribeToButton(callback) {
    const buttonId = get('options.buttonId', this.device)
    if (isEmpty(buttonId)) return callback()

    this.meshbluHttp.createSubscription({
      subscriberUuid: this.device.uuid,
      emitterUuid: buttonId,
      type: 'broadcast.sent',
    }, callback)
  }

  _subscribeToSelfBroadcastReceived(callback) {
    this.meshbluHttp.createSubscription({
      subscriberUuid: this.device.uuid,
      emitterUuid: this.device.uuid,
      type: 'broadcast.received',
    }, callback)
  }
}

module.exports = Rotator
