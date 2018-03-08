'use strict'

const Hemera = require('nats-hemera')
const Nats = require('nats')
const HemeraRabbitmq = require('./../index')
const Code = require('code')
const HemeraTestsuite = require('hemera-testsuite')
const expect = Code.expect

process.on('unhandledRejection', up => { throw up })

describe('Basic', function() {
  let PORT = 6242
  let natsUrl = 'nats://localhost:' + PORT

  let server
  let hemera
  let rabbitmq = {
    username: 'guest',
    password: 'guest'
  }

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
        name: 'pubsub',
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
        exchange: 'pubsub',
        target: 'payment',
        keys: []
      }
    ]
  }

  before(function(done) {
    server = HemeraTestsuite.start_server(PORT, () => {
      const nats = Nats.connect(natsUrl)
      hemera = new Hemera(nats)
      hemera.use(HemeraRabbitmq, { rabbitmq: options })
      hemera.ready(done)
    })
  })

  after(function() {
    hemera.close()
    server.kill()
  })

  it('simple pub/sub', function(done) {
    hemera.add(
      {
        topic: 'rabbitmq.publisher.message',
        cmd: 'subscribe'
      },
      function(req, cb) {
        cb()
      }
    )

    setTimeout(function() {
      hemera.act(
        {
          topic: 'rabbitmq',
          cmd: 'publish',
          exchange: 'pubsub',
          type: 'publisher.message',
          data: {
            name: 'peter',
            amount: 50
          }
        },
        function(err, resp) {
          expect(err).to.be.not.exists()
          expect(resp).to.be.equals({ result: 1 })
          done()
        }
      )
    }, 250)
  })
})
