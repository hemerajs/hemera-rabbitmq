# Hemera-rabbitmq

[![Build Status](https://travis-ci.org/hemerajs/hemera-rabbitmq.svg?branch=master)](https://travis-ci.org/hemerajs/hemera-rabbitmq)
[![npm](https://img.shields.io/npm/v/hemera-rabbitmq.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-rabbitmq)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [RabbitMQ](https://www.rabbitmq.com) with Hemera.

RabbitMQ is a messaging broker - an intermediary for messaging. It gives your applications a common platform to send and receive messages, and your messages a safe place to live until received. It is complementary to the primary NATS transport system. 

The client use JSON to transfer data.

### Support:
- PUB/SUB

## Start RabbitMQ instance

Start a rabbitmq instance via docker-compose
```
docker-compose up
```

## Administration

Visit http://127.0.0.1:15672 and log in with
```
Username: guest
Password: guest
```

### How does it work with NATS and Hemera
We use a seperate topic for every RabbitMQ Topic because with that you can listen in every hemera service for events. Every message will be delivered to the next subscriber. If you have running two instances of your hemera-amqp service and you use a __fanout__ mechanism you will execute your RPC multiple times. As you can see RabbitMQ give you new possibilities how to distribute your data but without lossing the benefits of nats-hemera with regard to load balancing and service-discovery.

#### Example

```js
'use strict'

const Hemera = require('nats-hemera')
const HemeraJoi = require('hemera-joi')
const nats = require('nats').connect()
const hemeraRabbitmq = require('hemera-rabbitmq')

// Topology & configuration via JSON look at https://github.com/arobson/rabbot
const options = ...

const hemera = new Hemera(nats, {
  logLevel: 'info'
})

hemera.use(HemeraJoi)
hemera.use(hemeraRabbitmq, { rabbitmq: options })

hemera.ready(() => {
  // Listen to a Rabbitmq events
  hemera.add({
    topic: 'rabbitmq.publisher.message',
    cmd: 'subscribe'
  }, function (req, cb) {
    this.log.info(req, 'Data')
    cb()
  })

  setTimeout(function () {
    // let's create rabbitmq subscription to redirect the traffic to hemera action
    hemera.act({
      topic: 'rabbitmq',
      cmd: 'subscribe',
      type: 'publisher.message'
    }, function (err, resp) {
      this.log.info(resp, 'Subscriber ACK')
    })

    // Send a message over Rabbitmq adn back to hemera
    hemera.act({
      topic: 'rabbitmq',
      cmd: 'publish',
      exchange: 'pubsub',
      type: 'publisher.message',
      data: {
        name: 'peter',
        amount: 50
      }
    }, function (err, resp) {
      this.log.info(resp, 'Publish ACK')
    })

  }, 500)

})
```

## Dependencies
- hemera-joi

## Interface

* [RabbitMQ API](#RabbitMQ-api)
  * [Publish](#publish)
  * [Create subscriber](#create-subscriber)
  * [Consume events](#consume-events)
  
 
-------------------------------------------------------
### publish

The pattern is:

* `topic`: is the service name to publish to `rabbitmq`
* `cmd`: is the command to execute `publish`
* `exchange`: the name of the exachange `string`
* `type`: the type `string`
* `data`: the data to transfer `object`

Example:
```js
hemera.act({
  topic: 'rabbitmq',
  cmd: 'publish',
  exchange: 'pubsub',
  type: 'publisher.message',
  data: {
    name: 'peter',
    amount: 50
  }
}, ...)
```

-------------------------------------------------------
### Create subscriber

The pattern is:

* `topic`: is the service name to publish to `rabbitmq`
* `cmd`: is the command to execute `subscribe`
* `type`: the type `string`

Example:
```js
hemera.act({
  topic: 'rabbitmq',
  cmd: 'subscribe',
  type: 'publisher.message'
}, ...)
```

-------------------------------------------------------
### Consume events

The pattern is:

* `topic`: is a combination of the serviec name and the type `rabbitmq.<type>`
* `cmd`: is the command to execute `subscribe`
* `type`: the type `string`

Example:
```js
hemera.add({
  topic: 'rabbitmq.publisher.message',
  cmd: 'subscribe'
}, ...)
```
