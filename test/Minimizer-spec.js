/* eslint-disable prefer-arrow-callback, func-names, no-unused-expressions */

const { beforeEach, describe, it } = global
const { expect } = require('chai')
const { EventEmitter } = require('events')
const shmock = require('shmock')
const sinon = require('sinon')
const Minimizer = require('../src/Minimizer')

describe('Minimizer', function() {
  describe('with a websocket server is listening', function() {
    beforeEach('create sut, api, meshbluFirehose, meshbluHttp', function(done) {
      this.api = shmock()
      this.child_process = {}
      this.meshbluFirehose = new EventEmitter()
      this.meshbluHttp = { createSubscription: sinon.stub().yields() }

      this.sut = new Minimizer({
        child_process: this.child_process,
        commands: {
          startSkype: 'echo "foooo"',
        },
        deviceId: 'device-id',
        meshbluFirehose: this.meshbluFirehose,
        meshbluHttp: this.meshbluHttp,
      })

      this.sut.run(done)
    })

    it('should create a message.received subscription to itself', function() {
      expect(this.meshbluHttp.createSubscription).to.have.been.calledWith({
        emitterUuid: 'device-id',
        subscriberUuid: 'device-id',
        type: 'message.received',
      })
    })

    // describe.only('when the firehose emits a startSkype message', function() {
    //   beforeEach('send "startSkype"', function() {
    //     this.child_process.exec = sinon.spy()
    //     this.meshbluFirehose.emit('message', { data: { data: { action: 'startSkype' } } })
    //   })
    //
    //   it('should call apiUrl/previous', function() {
    //     expect(this.child_process.exec).to.have.been.calledWith('echo "foooo"')
    //   })
    // })

    // describe('when the server broadcasts a rotateRight action', function() {
    //   beforeEach('broadcast "rotateRight"', function() {
    //     this.apiNext = this.api.post('/next').reply(201)
    //     this.wss.clients.forEach(client => client.send('{"data":{"action":"rotateRight"}}'))
    //   })
    //
    //   it('should call apiUrl/next', function(done) {
    //     this.apiNext.wait(1000, done)
    //   })
    // })
  })
})
