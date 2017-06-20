const { afterEach, beforeEach, describe, it } = global
const { expect }       = require('chai')
const { EventEmitter } = require('events')
const shmock           = require('shmock')
const sinon            = require('sinon')

const Connector = require('../src/Connector')

describe('Connector', function() {
  beforeEach('Instantiate the Connector', function(){
    this.api = shmock()
    this.meshbluHttp = {}
    this.meshbluFirehose = new EventEmitter()
    this.sut = new Connector({
      meshbluHttp: this.meshbluHttp,
      meshbluFirehose: this.meshbluFirehose,
      targetURL: `http://localhost:${this.api.address().port}`,
      uuid: 'connector-uuid',
     })
  })

  afterEach('stop api', function(done) {
    this.api.close(done)
  })

  it('should be', function(){
    expect(this.sut).to.exist
  })

  describe('->run', function(){
    describe('when there are no options', function(){
      beforeEach('call run', function(done){
        this.meshbluHttp.whoami = sinon.stub().yields(null, { })
        this.meshbluHttp.createSubscription = sinon.stub().yields()
        this.sut.run(done)
      })

      it('should create a broadcast.received subscription to itself', function(){
        expect(this.meshbluHttp.createSubscription).to.have.been.calledWith({
          subscriberUuid: 'connector-uuid',
          emitterUuid: 'connector-uuid',
          type: 'broadcast.received',
        })
      })

      it('should not create a broadcast.sent subscription to the button-id', function(){
        expect(this.meshbluHttp.createSubscription).to.have.been.calledOnce
      })
    })

    describe('when given a buttonId', function(){
      beforeEach('call run', function(done){
        this.meshbluHttp.whoami = sinon.stub().yields(null, { options: { buttonId: 'button-id' } })
        this.meshbluHttp.createSubscription = sinon.stub().yields()
        this.sut.run(done)
      })

      it('should create a broadcast.received subscription to itself', function(){
        expect(this.meshbluHttp.createSubscription).to.have.been.calledWith({
          subscriberUuid: 'connector-uuid',
          emitterUuid: 'connector-uuid',
          type: 'broadcast.received',
        })
      })

      it('should create a broadcast.sent subscription to the button-id', function(){
        expect(this.meshbluHttp.createSubscription).to.have.been.calledWith({
          subscriberUuid: 'connector-uuid',
          emitterUuid: 'button-id',
          type: 'broadcast.sent',
        })
      })
    })

    describe('when a rotateRight broadcast message comes in through the firehose', function(){
      beforeEach('setup <targetURL>/next endpoint and call run', function(done){
        this.apiNext = this.api.post('/next').reply(204)
        this.meshbluHttp.whoami = sinon.stub().yields(null, { })
        this.meshbluHttp.createSubscription = sinon.stub().yields()
        this.sut.run(done)
      })

      beforeEach('emit rotateRight', function(){
        this.meshbluFirehose.emit('message', { data: { action: 'rotateRight' } })
      })

      it('should call <targetURL>/next', function(done){
        this.apiNext.wait(1000, done)
      })
    })
  })
})
