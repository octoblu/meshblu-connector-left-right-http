/* eslint-disable prefer-arrow-callback, func-names, no-unused-expressions */
const { afterEach, beforeEach, describe, it } = global
const { expect } = require('chai')
const { EventEmitter } = require('events')
const shmock = require('shmock')
const sinon = require('sinon')

const Connector = require('../src/Connector')

describe('Connector', function() {
  beforeEach('Instantiate the Connector', function() {
    this.api = shmock()
    this.child_process = {}
    this.meshbluHttp = {}
    this.meshbluFirehose = new EventEmitter()
    this.meshbluFirehose.connect = sinon.stub()
    this.sut = new Connector({
      child_process: this.child_process,
      meshbluHttp: this.meshbluHttp,
      meshbluFirehose: this.meshbluFirehose,
    })
  })

  afterEach('stop api', function(done) {
    this.api.close(done)
  })

  it('should be', function() {
    expect(this.sut).to.exist
  })

  describe('->run', function() {
    describe('when there are no options', function() {
      beforeEach('call run', function(done) {
        this.meshbluHttp.whoami = sinon.stub().yields(null, { uuid: 'connector-uuid' })
        this.meshbluHttp.createSubscription = sinon.stub().yields()
        this.sut.run(done)
      })

      it('should create a broadcast.received subscription to itself', function() {
        expect(this.meshbluHttp.createSubscription).to.have.been.calledWith({
          subscriberUuid: 'connector-uuid',
          emitterUuid: 'connector-uuid',
          type: 'broadcast.received',
        })
      })

      it('should create a message.received subscription to itself', function() {
        expect(this.meshbluHttp.createSubscription).to.have.been.calledWith({
          subscriberUuid: 'connector-uuid',
          emitterUuid: 'connector-uuid',
          type: 'message.received',
        })
      })

      it('should not create a broadcast.sent subscription to the button-id', function() {
        expect(this.meshbluHttp.createSubscription).to.have.been.calledTwice
      })

      it('should call meshbluFirehose.connect', function() {
        expect(this.meshbluFirehose.connect).to.have.been.called
      })
    })

    describe('when given a buttonId', function() {
      beforeEach('call run', function(done) {
        this.meshbluHttp.whoami = sinon.stub().yields(null, { uuid: 'connector-uuid', options: { buttonId: 'button-id' } })
        this.meshbluHttp.createSubscription = sinon.stub().yields()
        this.sut.run(done)
      })

      it('should create a broadcast.received subscription to itself', function() {
        expect(this.meshbluHttp.createSubscription).to.have.been.calledWith({
          subscriberUuid: 'connector-uuid',
          emitterUuid: 'connector-uuid',
          type: 'broadcast.received',
        })
      })

      it('should create a broadcast.sent subscription to the button-id', function() {
        expect(this.meshbluHttp.createSubscription).to.have.been.calledWith({
          subscriberUuid: 'connector-uuid',
          emitterUuid: 'button-id',
          type: 'broadcast.sent',
        })
      })
    })

    describe('when a rotateRight broadcast message comes in through the firehose', function() {
      beforeEach('setup <apiURL>/next endpoint and call run', function(done) {
        this.apiNext = this.api.post('/next').reply(204)
        this.meshbluHttp.whoami = sinon.stub().yields(null, {
          uuid: 'connector-uuid',
          options: {
            apiURL: `http://localhost:${this.api.address().port}`,
          },
        })
        this.meshbluHttp.createSubscription = sinon.stub().yields()
        this.sut.run(done)
      })

      beforeEach('emit rotateRight', function() {
        this.meshbluFirehose.emit('message', { data: { data: { action: 'rotateRight' } } })
      })

      it('should call <apiURL>/next', function(done) {
        this.apiNext.wait(1000, done)
      })
    })

    describe('when a rotateLeft broadcast message comes in through the firehose', function() {
      beforeEach('setup <apiURL>/previous endpoint and call run', function(done) {
        this.apiPrevious = this.api.post('/previous').reply(204)
        this.meshbluHttp.whoami = sinon.stub().yields(null, {
          uuid: 'connector-uuid',
          options: {
            apiURL: `http://localhost:${this.api.address().port}`,
          },
        })
        this.meshbluHttp.createSubscription = sinon.stub().yields()
        this.sut.run(done)
      })

      beforeEach('emit rotateLeft', function() {
        this.meshbluFirehose.emit('message', { data: { data: { action: 'rotateLeft' } } })
      })

      it('should call <apiURL>/next', function(done) {
        this.apiPrevious.wait(1000, done)
      })
    })

    describe('when a click broadcast message comes in through the firehose', function() {
      beforeEach('call run', function(done) {
        this.meshbluHttp.whoami = sinon.stub().yields(null, {
          uuid: 'connector-uuid',
          options: {
            apiURL: `http://localhost:${this.api.address().port}`,
          },
        })
        this.meshbluHttp.createSubscription = sinon.stub().yields()
        this.sut.run(done)
      })

      beforeEach('emit rotateLeft', function() {
        this.meshbluFirehose.emit('message', { data: { data: { action: 'click' } } })
      })

      it('should not call the api', function() {
      })
    })

    describe('when a startSkype direct message comes in through the firehose', function() {
      beforeEach('call run', function(done) {
        this.child_process.exec = sinon.stub()
        this.meshbluHttp.whoami = sinon.stub().yields(null, {
          uuid: 'connector-uuid',
          options: {
            apiURL: `http://localhost:${this.api.address().port}`,
            commands: {
              startSkype: 'echo "foooo"',
            },
          },
        })
        this.meshbluHttp.createSubscription = sinon.stub().yields()
        this.sut.run(done)
      })

      beforeEach('emit startSkype', function() {
        this.meshbluFirehose.emit('message', { data: { data: { action: 'startSkype' } } })
      })

      it('should run the startSkype command', function() {
        expect(this.child_process.exec).to.have.been.calledWith('echo "foooo"')
      })
    })

    describe('when an endSkype direct message comes in through the firehose', function() {
      beforeEach('call run', function(done) {
        this.child_process.exec = sinon.stub()
        this.meshbluHttp.whoami = sinon.stub().yields(null, {
          uuid: 'connector-uuid',
          options: {
            apiURL: `http://localhost:${this.api.address().port}`,
            commands: {
              endSkype: 'echo "baaar"',
            },
          },
        })
        this.meshbluHttp.createSubscription = sinon.stub().yields()
        this.sut.run(done)
      })

      beforeEach('emit endSkype', function() {
        this.meshbluFirehose.emit('message', { data: { data: { action: 'endSkype' } } })
      })

      it('should run the endSkype command', function() {
        expect(this.child_process.exec).to.have.been.calledWith('echo "baaar"')
      })
    })
  })
})
