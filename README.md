# HomeBus

A simple bus implementation for M2M. Not intended to be the fastest but to implement a set of features and be simple to use and setup.

## Features

* HTTP API for posting messages
* Forwarding of messages to other HomeBus instance
* Possible to delay and batch forwarded messages
* Easy node.js client for posting and receiving
* Make it possible to wait for reaction to sent message

## Message spec

```json
{
    head: {
        id: "e90961b8-4d3d-11e9-93ae-ff1a8e2e3b8b",
        version: 1,
        time: "2019-03-22T16:37:33Z",
        type: "",
        reactionTo: "3e0b15f8-4d3e-11e9-bf4a-0b27bb8976c4"
    },
    brokers: [
        {
            time: "2019-03-22T16:37:33Z",
            name: "home",
        }
    ],
    data: {

    }
}
```

### head

**id** - UUID to identify message
**version** - Version of the message spec
**time** - Date and time string in ISO-8601 format of when message was created
**type** - String identifying the structure of data, user defined
**reactionTo** - Optional UUID that this message is a reaction to

### brokers

Array of brokers this message has passed through, the list is appended (First broker first in list).

**time** - Date and time string in ISO-8601 format of when message was received by tge broker
**name** - Name of the broker instance

## API

POST with message as JSON payload, authentication token as header *homebus-token*.

Websocket connection to subscribe to messages, authentication token as header *homebus-token*.
It will also be possible to post messages via an existing websocket link.

## Client Library API

```javascript
// Will POST if now websocket exists and use websocket if link exists
const message = await homebus.send(type: String, data: Object, reactionTo: String [optional])

homebus.on("message", (message) => {});
```
