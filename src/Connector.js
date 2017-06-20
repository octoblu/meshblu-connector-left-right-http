const async = require('async')
const debug = require('debug')('meshblu-connector-left-right-http')
const bindAll = require('lodash/fp/bindAll')
const get = require('lodash/fp/get')
const isEmpty = require('lodash/fp/isEmpty')
const request = require('request')

const PATHS = {
  rotateLeft: '/previous',
  rotateRight: '/next',
}

class Connector {
  constructor({ meshbluHttp, meshbluFirehose }) {
    bindAll(Object.getOwnPropertyNames(Connector.prototype), this)

    this.meshbluHttp = meshbluHttp
    this.meshbluFirehose = meshbluFirehose
  }

  run(callback) {
    this.meshbluFirehose.on('message', this._onMessage)
    this.meshbluFirehose.connect()

    async.series([
      this._retrieveSelf,
      this._subscribeToButton,
      this._subscribeToSelf,
    ], callback)
  }

  _onMessage(message) {
    const action = get('data.data.action', message)
    const uri = PATHS[action]
    const baseUrl = get('options.apiURL', this.device)
    debug('_onMessage', JSON.stringify({ action, baseUrl, uri }, null, 2))
    if (isEmpty(uri)) return

    return request.post({ baseUrl, uri })
  }

  _retrieveSelf(callback) {
    this.meshbluHttp.whoami((error, device) => {
      if (error) return callback(error)
      this.device = device
      callback()
    })
  }

  _subscribeToButton(callback) {
    const buttonId = get('options.buttonId', this.device)
    if (isEmpty(buttonId)) return callback()

    this.meshbluHttp.createSubscription({
      subscriberUuid: get('uuid', this.device),
      emitterUuid: buttonId,
      type: 'broadcast.sent',
    }, callback)
  }

  _subscribeToSelf(callback) {
    this.meshbluHttp.createSubscription({
      subscriberUuid: get('uuid', this.device),
      emitterUuid: get('uuid', this.device),
      type: 'broadcast.received',
    }, callback)
  }
}

module.exports = Connector
