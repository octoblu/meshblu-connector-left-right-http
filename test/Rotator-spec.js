/* eslint-disable prefer-arrow-callback, func-names, no-unused-expressions */

const { beforeEach, describe, it } = global
const after = require('lodash/fp/after')
const portfinder = require('portfinder')
const shmock = require('shmock')
const WebSocket = require('ws')
const Rotator = require('../src/Rotator')

describe('Rotator', function() {
  describe('with a websocket server is listening', function() {
    beforeEach('find a free port', function(done) {
      portfinder.getPort((error, port) => {
        if (error) return done(error)
        this.websocketPort = port
        return done()
      })
    })

    beforeEach('create sut, api, wss', function(done) {
      const doneTwice = after(done, 2)
      this.api = shmock()
      this.wss = new WebSocket.Server({ port: this.websocketPort })
      this.sut = new Rotator({
        urls: {
          rotateLeft: `http://localhost:${this.api.address().port}/previous`,
          rotateRight: `http://localhost:${this.api.address().port}/next`,
        },
        websocketUrl: `ws://localhost:${this.websocketPort}`,
      })

      this.wss.on('error', done)
      this.wss.on('connection', () => doneTwice())
      this.sut.run((error) => {
        if (error) return done(error)
        doneTwice()
      })
    })

    describe('when the server broadcasts a rotateLeft action', function() {
      beforeEach('broadcast "rotateLeft"', function() {
        this.apiPrevious = this.api.post('/previous').reply(201)
        this.wss.clients.forEach(client => client.send('{"data":{"action":"rotateLeft"}}'))
      })

      it('should call apiUrl/previous', function(done) {
        this.apiPrevious.wait(1000, done)
      })
    })

    describe('when the server broadcasts a rotateRight action', function() {
      beforeEach('broadcast "rotateRight"', function() {
        this.apiNext = this.api.post('/next').reply(201)
        this.wss.clients.forEach(client => client.send('{"data":{"action":"rotateRight"}}'))
      })

      it('should call apiUrl/next', function(done) {
        this.apiNext.wait(1000, done)
      })
    })
  })
})
