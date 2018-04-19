# Hemera-rabbitmq

[![Build Status](https://travis-ci.org/hemerajs/hemera-rabbitmq.svg?branch=master)](https://travis-ci.org/hemerajs/hemera-rabbitmq)
[![npm](https://img.shields.io/npm/v/hemera-rabbitmq.svg?maxAge=3600)](https://www.npmjs.com/package/hemera-rabbitmq)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](#badge)

This is a plugin to use [RabbitMQ](https://www.rabbitmq.com) with Hemera.

RabbitMQ is a messaging broker - an intermediary for messaging. It gives your applications a common platform to send and receive messages, and your messages a safe place to live until received. It is complementary to the primary NATS transport system.

The client use JSON to transfer data.

## Start RabbitMQ instance

Start a rabbitmq instance via docker-compose

```
docker-compose up
```

## Administration

Visit http://127.0.0.1:15672 and log in with

```
Username: user
Password: user
```

#### Example

```js
const Hemera = require('nats-hemera')
const nats = require('nats').connect()
const hemera = new Hemera(nats, {
  logLevel: 'info'
})
hemera.use(require('hemera-joi'))
// Topology & configuration via JSON look at https://github.com/arobson/rabbot
hemera.use(require('hemera-rabbitmq', { rabbot: options }))
```

## Plugin dependencies

* hemera-joi

## Interface

* [RabbitMQ API](#RabbitMQ-api)

  * [Publish](#publish)
  * [Request](#request)
  * [Create pub/sub subscriber](#Create-pub-sub-subscriber)
  * [Create request/reply subscriber](#Create-request-reply-subscriber)
  * [Consume events](#consume-events)

---

### publish

The pattern is:

* `topic`: is the service name to publish to `rabbitmq`
* `cmd`: is the command to execute `publish`
* `exchange`: the name of the exachange `string`
* `options`: rabbot transport options `object`
* `data`: the data to transfer `object`

Example:

```js
hemera.act(
  {
    topic: 'rabbitmq',
    cmd: 'publish',
    exchange: 'pubsub',
    options: {
      type: 'MyMessage'
    },
    data: {
      name: 'peter',
      amount: 50
    }
  },
  function() {}
)
```

---

### request

The pattern is:

* `topic`: is the service name to publish to `rabbitmq`
* `cmd`: is the command to execute `publish`
* `exchange`: the name of the exachange `string`
* `options`: rabbot transport options `object`
* `data`: the data to transfer `object`

Example:

```js
hemera.act(
  {
    topic: 'rabbitmq',
    cmd: 'request',
    exchange: 'request',
    options: {
      type: 'MyRequest'
    },
    data: {
      name: 'peter',
      amount: 50
    }
  },
  function() {}
)
```

---

### Create pub/sub subscriber

The interface is:

* `pattern`: the pattern which arrive hemera
* `type`: the type `string`

Example:

```js
hemera.rabbitmq.addPubSubProxy(
  {
    type: 'MyMessage'
    pattern: {}
  }
)
```

---

### Create request/reply subscriber

The interface is:

* `pattern`: the pattern which arrive hemera
* `type`: the type `string`

Example:

```js
hemera.rabbitmq.addRequestProxy(
  {
    type: 'MyMessage'
    pattern: {}
  }
)
```

---

### Consume events

The pattern is:

* `topic`: is a combination of the serviec name and the type `rabbitmq.<type>`

Example:

```js
hemera.add(
  {
    topic: 'rabbitmq.MyMessage'
  },
  function(req, reply) {
    // In case of pub / sub you can't reply
    // In case of request / reply you can only reply with valid json
  }
)
```
