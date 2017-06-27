const debug = require('debug')('meshblu-connector-left-right-http:Rotator')
const bindAll = require('lodash/fp/bindAll')
const get = require('lodash/fp/get')
const isEmpty = require('lodash/fp/isEmpty')
const request = require('request')
const WebSocket = require('ws')

class Rotator {
  constructor({ urls, websocketUrl }) {
    bindAll(Object.getOwnPropertyNames(Rotator.prototype), this)

    if (!urls) throw new Error('Missing required parameter: urls')
    if (!websocketUrl) throw new Error('Missing required parameter: websocketUrl')

    this.urls = urls
    this.websocketUrl = websocketUrl
  }

  run(callback) {
    const ws = new WebSocket(this.websocketUrl)
    ws.on('message', this._onMessage)
    ws.on('open', callback)
  }

  //
  _onMessage(rawMessage) {
    const message = JSON.parse(rawMessage)
    debug('_onMessage', message)
    const action = get('data.action', message)
    const uri = this.urls[action]

    if (isEmpty(uri)) return
    debug('_onMessage', uri)
    request.post(uri)
  }
}

module.exports = Rotator
