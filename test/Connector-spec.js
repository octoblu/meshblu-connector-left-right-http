/* eslint-disable prefer-arrow-callback, func-names, no-unused-expressions */
const { afterEach, beforeEach, describe, it } = global
const { expect } = require('chai')
const { EventEmitter } = require('events')
const portfinder = require('portfinder')
const shmock = require('shmock')
const sinon = require('sinon')
const WebSocket = require('ws')

const Connector = require('../src/Connector')

describe('Connector', function() {
  beforeEach('find a free port', function(done) {
    portfinder.getPort((error, port) => {
      if (error) return done(error)
      this.websocketPort = port
      return done()
    })
  })

  beforeEach('Start the websocket server', function(done) {
    this.wss = new WebSocket.Server({ port: this.websocketPort }, done)
  })

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

  afterEach('close the websocket server', function(done) {
    this.wss.close(done)
  })

  afterEach('close the api server', function(done) {
    this.api.close(done)
  })

  it('should be', function() {
    expect(this.sut).to.exist
  })

  describe('->run', function() {
    describe('when there are no options', function() {
      beforeEach('call run', function(done) {
        this.meshbluHttp.whoami = sinon.stub().yields(null, { uuid: 'connector-uuid' })
        this.sut.run(done)
      })

      it('should call meshbluFirehose.connect', function() {
        expect(this.meshbluFirehose.connect).to.have.been.called
      })
    })

    describe('when a startSkype direct message comes in through the firehose', function() {
      beforeEach('call run', function(done) {
        this.child_process.exec = sinon.stub()
        this.meshbluHttp.whoami = sinon.stub().yields(null, {
          uuid: 'connector-uuid',
          leftRightOptions: {
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
          leftRightOptions: {
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

    describe('when a rotateLeft message is emitted by the websocket', function() {
      beforeEach('run sut', function(done) {
        this.meshbluHttp.whoami = sinon.stub().yields(null, {
          uuid: 'connector-uuid',
          leftRightOptions: {
            buttonUrl: `ws://localhost:${this.websocketPort}`,
            rotatorUrls: {
              rotateLeft: `http://localhost:${this.api.address().port}/previous`,
            },
          },
        })
        this.apiPrevious = this.api.post('/previous').reply(201)
        this.sut.run(done)
      })

      beforeEach('emit "rotateLeft"', function() {
        this.wss.clients.forEach(client => client.send('{"data":{"action": "rotateLeft"}}'))
      })

      it('should make a post to /previous', function(done) {
        this.apiPrevious.wait(1000, done)
      })
    })
  })
})
