/* eslint-disable no-constant-condition */
/* eslint-disable no-console */
/* eslint-disable new-cap */
/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
/* eslint-disable consistent-return */

const amqp = require('amqplib/callback_api');

// if the connection is closed or fails to be established at all, we will reconnect
let amqpConn = null;
let pubChannel = null;
const offlinePubQueue = [];

function work(msg, cb) {
  console.log('Got msg ', msg.content.toString());
  cb(true);
}

function closeOnErr(err) {
  if (!err) return false;
  console.error('[AMQP] error', err);
  amqpConn.close();
  return true;
}

function publish(exchange, routingKey, content) {
  try {
    pubChannel.publish(exchange, routingKey, content, { persistent: true },
      (err, ok) => {
        if (err) {
          console.error('[AMQP] publish', err);
          offlinePubQueue.push([exchange, routingKey, content]);
          pubChannel.connection.close();
        }
      });
  } catch (e) {
    console.error('[AMQP] publish', e.message);
    offlinePubQueue.push([exchange, routingKey, content]);
  }
}

function startPublisher() {
  amqpConn.createConfirmChannel((err, ch) => {
    if (closeOnErr(err)) return;
    ch.on('error', (err) => {
      console.error('[AMQP] channel error', err.message);
    });
    ch.on('close', () => {
      console.log('[AMQP] channel closed');
    });

    pubChannel = ch;
    while (true) {
      const m = offlinePubQueue.shift();
      if (!m) break;
      publish(m[0], m[1], m[2]);
    }
  });
}

// A worker that acks messages only if processed succesfully
function startWorker() {
  amqpConn.createChannel((err, ch) => {
    if (closeOnErr(err)) return;
    ch.on('error', (err) => {
      console.error('[AMQP] channel error', err.message);
    });

    ch.on('close', () => {
      console.log('[AMQP] channel closed');
    });

    function processMsg(msg) {
      work(msg, (ok) => {
        try {
          if (ok) ch.ack(msg);
          else ch.reject(msg, true);
        } catch (e) {
          closeOnErr(e);
        }
      });
    }

    ch.prefetch(10);
    ch.assertQueue('jobs', { durable: true }, (err, _ok) => {
      if (closeOnErr(err)) return;
      ch.consume('jobs', processMsg, { noAck: false });
      console.log('Worker is started');
    });
  });
}

function whenConnected() {
  startPublisher();
  startWorker();
}

function start() {
  amqp.connect(`${process.env.CLOUDAMQP_URL}?heartbeat=60`, (err, conn) => {
    if (err) {
      console.error('[AMQP]', err.message);
      return setTimeout(start, 1000);
    }
    conn.on('error', (err) => {
      if (err.message !== 'Connection closing') {
        console.error('[AMQP] conn error', err.message);
      }
    });
    conn.on('close', () => {
      console.error('[AMQP] reconnecting');
      return setTimeout(start, 1000);
    });
    console.log('[AMQP] connected');
    amqpConn = conn;
    whenConnected();
  });
}

start();

setInterval(() => {
  publish('', 'jobs', new Buffer.from('work work work'));
}, 1000);
