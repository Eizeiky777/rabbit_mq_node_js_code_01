/* eslint-disable max-len */
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

const amqp = require('amqplib/callback_api');
const { config } = require('../../config/rabbit_config');

let amqpConn = null;
let pubChannel = null;

const offlinePubQueue = [];
const exchange = 'my-delay-exchange';

function closeOnErr(err) {
  if (!err) return false;
  console.error('[AMQP] error', err);
  amqpConn.close();
  return true;
}


function current_time() {
  const now = new Date();
  let hour = `${now.getHours()}`; if (hour.length === 1) { hour = `0${hour}`; }
  let minute = `${now.getMinutes()}`; if (minute.length === 1) { minute = `0${minute}`; }
  let second = `${now.getSeconds()}`; if (second.length === 1) { second = `0${second}`; }
  return `${hour}:${minute}:${second}`;
}


function publish(routingKey, content, delay) {
  try {
    pubChannel.publish(exchange, routingKey, content, { headers: { 'x-delay': delay } },
      (err, ok) => {
        if (err) {
          console.error('[AMQP] publish', err);
          offlinePubQueue.push([exchange, routingKey, content]);
          pubChannel.connection.close();
        }
      });
  } catch (e) {
    console.error('[AMQP] failed', e.message);
    offlinePubQueue.push([routingKey, content, delay]);
  }
}


// function whenConnected() {
//   startPublisher();
//   startConsumeDelay();
// }


// ========================================================================================================================= //

// A worker that acks messages only if processed succesfully
exports.consumeRabbitDelay = () => {
  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}?heartbeat=60`, (err, conn) => {
    conn.createChannel((createErr, ch) => {
      if (closeOnErr(createErr)) return;
      ch.on('error', (onErr) => {
        console.error('[AMQP] channel error', onErr.message);
      });
      ch.on('close', () => {
        console.log('[AMQP] channel closed');
      });

      function work(msg, cb) {
        console.log(`${msg.content.toString()} --- received: ${current_time()}`);
        cb(true);
      }

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
      ch.assertQueue('jobs', { durable: true }, (closeErr, _ok) => {
        if (closeOnErr(closeErr)) return;
        ch.consume('jobs', processMsg, { noAck: false });
        console.log('Scheduler Consumer is Started');
      });
    });
  });
};

function startPublisher() {
  amqpConn.createConfirmChannel((err, ch) => {
    if (closeOnErr(err)) return;
    ch.on('error', (onErr) => {
      console.error('[AMQP] channel error', onErr.message);
    });
    ch.on('close', () => {
      console.log('[AMQP] channel closed');
    });

    pubChannel = ch;
    // assert the exchange: 'my-delay-exchange' to be a x-delayed-message,
    pubChannel.assertExchange(exchange, 'x-delayed-message', {
      autoDelete: false, durable: true, passive: true, arguments: { 'x-delayed-type': 'direct' },
    });
    // Bind the queue: "jobs" to the exchnage: "my-delay-exchange" with the binding key "jobs"
    pubChannel.bindQueue('jobs', exchange, 'jobs');

    // eslint-disable-next-line no-constant-condition
    // while (true) {
    //   const m = offlinePubQueue.shift();
    //   if (!m) break;
    //   publish(m[0], m[1], m[2]);
    // }

    const limit = [1, 2, 3, 4, 5];
    limit.forEach((e) => {
      publish('jobs', Buffer.from(`work sent: ${current_time()}`), 2000 * e);
    });
  });
}

exports.startRabbitDelay = (req, res) => {
  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}?heartbeat=60`, (err, conn) => {
    if (err) {
      console.error('[AMQP]', err.message);
      return setTimeout(this.startRabbitDelay, 1000);
    }

    conn.on('error', (onErr) => {
      if (onErr.message !== 'Connection closing') {
        console.error('[AMQP] conn error', onErr.message);
      }
    });

    conn.on('close', () => {
      console.error('[AMQP] reconnecting');
      return setTimeout(this.startRabbitDelay, 1000);
    });

    console.log('[AMQP] connected');
    amqpConn = conn;
    // whenConnected();

    startPublisher();
    return res.status(200).send('successfully send schedule message');
  });
};


// Publish a message every 10 second. The message will be delayed 10seconds.
// setInterval(() => {
//   const date = new Date();
//   publish('jobs', Buffer.from(`work sent: ${current_time()}`), 10000);
// }, 10000);
