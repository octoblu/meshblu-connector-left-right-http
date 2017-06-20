const bindAll = require('lodash/fp/bindAll')
const get = require('lodash/fp/get')
const isEmpty = require('lodash/fp/isEmpty')
const request = require('request')

const PATHS = {
  rotateLeft: '/previous',
  rotateRight: '/next',
}

class Connector {
  constructor({ meshbluHttp, meshbluFirehose, targetURL, uuid }) {
    bindAll(Object.getOwnPropertyNames(Connector.prototype), this)

    this.meshbluHttp = meshbluHttp
    this.meshbluFirehose = meshbluFirehose
    this.uuid = uuid
    this.targetURL = targetURL
  }

  run(callback) {
    this.meshbluFirehose.on('message', this._onMessage)

    this._subscribeToSelf((error) => {
      if (error) return callback(error)
      this._subscribeToButton(callback)
    })
  }

  _onMessage(message) {
    const action = get('data.action', message)
    const uri = PATHS[action]
    if (isEmpty(uri)) return

    return request.post({ baseUrl: this.targetURL, uri })
  }

  _subscribeToButton(callback) {
    this.meshbluHttp.whoami((error, me) => {
      if (error) return callback(error)
      const buttonId = get('options.buttonId', me)
      if (isEmpty(buttonId)) return callback()

      this.meshbluHttp.createSubscription({
        subscriberUuid: this.uuid,
        emitterUuid: buttonId,
        type: 'broadcast.sent',
      }, callback)
    })
  }

  _subscribeToSelf(callback) {
    this.meshbluHttp.createSubscription({
      subscriberUuid: this.uuid,
      emitterUuid: this.uuid,
      type: 'broadcast.received',
    }, callback)
  }
}

module.exports = Connector
