'use strict'

const Hp = require('hemera-plugin')
const Rabbit = require('rabbot')

function hemeraRabbitmq(hemera, opts) {
  const handlers = []
  const Joi = hemera.joi

  hemera.decorate('rabbitmq', {
    handlers
  })

  return Rabbit.configure(opts.rabbitmq).then(function() {
    // Sends all unhandled messages back to the queue.
    Rabbit.nackUnhandled()

    // after this call, any new callbacks attached via handle will be wrapped in a try/catch
    // that nacks the message on an error
    Rabbit.nackOnError()

    function consume(type, cb) {
      // only once per hemera instance
      if (handlers[type]) {
        return
      }

      const handler = Rabbit.handle(type, function(msg) {
        hemera.act(
          {
            topic: `rabbitmq.${type}`,
            cmd: 'subscribe',
            data: msg.body
          },
          err => {
            if (!err) {
              return msg.ack()
            }

            msg.unack()
          }
        )
      })

      handlers[type] = handler

      cb(null, true)
    }

    hemera.add(
      {
        topic: 'rabbitmq',
        cmd: 'subscribe',
        type: Joi.string().required()
      },
      (req, cb) => consume(req.type, cb)
    )

    hemera.add(
      {
        topic: 'rabbitmq',
        cmd: 'publish',
        exchange: Joi.string().required(),
        type: Joi.string().required(),
        data: Joi.object().required()
      },
      function(req) {
        return Rabbit.publish(req.exchange, {
          type: req.type,
          body: req.data
        }).then(function() {
          return true
        })
      }
    )
  })
}

const plugin = Hp(hemeraRabbitmq, {
  hemera: '^3.0.0',
  name: require('./package.json').name,
  dependencies: ['hemera-joi'],
  options: {
    payloadValidator: 'hemera-joi'
  }
})

module.exports = plugin
