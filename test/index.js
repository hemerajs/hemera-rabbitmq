'use strict'

const Hemera = require('nats-hemera')
const HemeraJoi = require('hemera-joi')
const Nats = require('nats')
const HemeraRabbitmq = require('./../index')
const Code = require('code')
const HemeraTestsuite = require('hemera-testsuite')
const expect = Code.expect

describe('Basic', function() {
  let PORT = 6242
  let natsUrl = 'nats://localhost:' + PORT

  let server
  let hemera
  let rabbitmq = {
    username: 'guest',
    password: 'guest'
  }
  let topic = 'rabbitmq'

  const options = {
    // arguments used to establish a connection to a broker
    connection: {
      uri: `amqp://${rabbitmq.username}:${
        rabbitmq.password
      }@127.0.0.1:5672/?heartbeat=10`
    },

    // define the exchanges
    exchanges: [
      {
        name: 'myexchange',
        type: 'fanout'
      }
    ],
    queues: [
      {
        name: 'payment',
        autoDelete: true,
        subscribe: true
      }
    ],
    // binds exchanges and queues to one another
    bindings: [
      {
        exchange: 'myexchange',
        target: 'payment',
        keys: []
      }
    ]
  }

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, () => {
      const nats = Nats.connect(natsUrl)
      hemera = new Hemera(nats)
      hemera.use(HemeraJoi)
      hemera.use(HemeraRabbitmq, { rabbot: options })
      hemera.ready(done)
    })
  })

  after(function() {
    hemera.close()
    server.kill()
  })

  it('simple pub/sub', function(done) {
    const subject = 'message'
    const payload = {
      name: 'peter',
      amount: 50
    }
    hemera.add(
      {
        topic: `${topic}.${subject}`
      },
      req => {
        expect(req.data).to.be.equals(payload)
        done()
      }
    )

    hemera.rabbitmq.addPubSubProxy({
      type: subject
    })

    hemera.act(
      {
        topic: 'rabbitmq',
        cmd: 'publish',
        exchange: 'myexchange',
        options: {
          type: subject
        },
        data: payload
      },
      function(err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals(true)
      }
    )
  })

  it('simple req/reply', function(done) {
    const subject = 'request'
    const payload = {
      name: 'peter',
      amount: 50
    }
    hemera.add(
      {
        topic: `${topic}.${subject}`
      },
      (req, cb) => {
        expect(req.data).to.be.equals(payload)
        cb(null, { foo: 'bar' })
      }
    )

    hemera.rabbitmq.addRequestProxy({
      type: subject
    })

    hemera.act(
      {
        topic: 'rabbitmq',
        cmd: 'request',
        exchange: 'myexchange',
        options: {
          type: subject
        },
        data: payload
      },
      function(err, resp) {
        expect(err).to.be.not.exists()
        expect(resp).to.be.equals({ foo: 'bar' })
        done()
      }
    )
  })
})
