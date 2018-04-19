'use strict'

const Hp = require('hemera-plugin')
const Rabbit = require('rabbot')

function hemeraRabbitmq(hemera, opts) {
  const Joi = hemera.joi
  const topic = 'rabbitmq'

  return Rabbit.configure(opts.rabbot)
    .then(() => {
      // Sends all unhandled messages back to the queue.
      Rabbit.nackUnhandled()

      // after this call, any new callbacks attached via handle will be wrapped in a try/catch
      // that nacks the message on an error
      Rabbit.nackOnError()

      hemera.decorate('rabbitmq', {
        addPubSubProxy: opts => publisher(opts),
        addRequestProxy: opts => requestor(opts)
      })

      function publisher(consOpts) {
        Rabbit.handle(consOpts, msg => {
          let pattern = {
            pubsub$: true,
            topic: `${topic}.${consOpts.type}`,
            data: msg.body
          }
          if (typeof consOpts.pattern === 'object') {
            pattern = Object.assign(consOpts.pattern, pattern)
          }
          hemera.act(pattern, err => {
            if (err) {
              msg.nack()
              return
            }
            msg.ack()
          })
        })
      }

      function requestor(consOpts) {
        Rabbit.handle(consOpts, msg => {
          let pattern = {
            topic: `${topic}.${consOpts.type}`,
            data: msg.body
          }
          if (typeof consOpts.pattern === 'object') {
            pattern = Object.assign(consOpts.pattern, pattern)
          }
          hemera.act(pattern, (err, req) => {
            if (err) {
              msg.nack()
              return
            }
            msg.ack()
            msg.reply(req)
          })
        })
      }

      hemera.add(
        {
          topic,
          cmd: 'publish',
          exchange: Joi.string().required(),
          options: Joi.object().required(),
          data: Joi.object().required()
        },
        function(req) {
          return Rabbit.publish(
            req.exchange,
            Object.assign({ body: req.data }, req.options)
          )
            .then(() => true)
            .catch(err => convertRabbotErr(err))
        }
      )

      hemera.add(
        {
          topic,
          cmd: 'request',
          exchange: Joi.string().required(),
          options: Joi.object().required(),
          data: Joi.object().required()
        },
        function(req) {
          return Rabbit.request(
            req.exchange,
            Object.assign({ body: req.data }, req.options)
          )
            .then(response => {
              response.ack()
              return response.body
            })
            .catch(err => convertRabbotErr(err))
        }
      )
    })
    .catch(err => convertRabbotErr(err))
}

function convertRabbotErr(err) {
  if (typeof err === 'string') {
    return Promise.reject(new Error('rabbot: ' + err))
  }
  return err
}

const plugin = Hp(hemeraRabbitmq, {
  hemera: '^5.0.0',
  name: require('./package.json').name,
  dependencies: ['hemera-joi'],
  decorators: ['joi']
})

module.exports = plugin
