/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint-disable no-constant-condition */
/* eslint-disable no-console */
/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */

const amqp = require('amqplib/callback_api');
const { config } = require('../../config/rabbit_config');

function work(msg, cb) {
  console.log('Got msg ', msg.content.toString());
  cb(true);
}

function closeOnErr(err, conn) {
  if (!err) return false;
  console.error('[AMQP] error', err);
  conn.close();
  return true;
}

const offlinePubQueue = [];
function publish(exchange, routingKey, content, chPub) {
  try {
    chPub.publish(exchange, routingKey, content, { persistent: true },
      (err, ok) => {
        if (err) {
          console.error('[AMQP] publish', err);
          offlinePubQueue.push([exchange, routingKey, content]);
          chPub.connection.close();
        }
      });
  } catch (e) {
    console.error('[AMQP] publish', e.message);
    offlinePubQueue.push([exchange, routingKey, content]);
  }
}

// A worker that acks messages only if processed succesfully or retry again if failed with limited attemps
let qAttemps = 1;
function startConsume(conn) {
  conn.createChannel((err, ch) => {
    if (closeOnErr(err, conn)) return;

    ch.on('error', (err2) => {
      console.error('[AMQP] channel error', err2.message);
    });

    ch.on('close', () => {
      console.log('[AMQP] channel closed');
    });

    function processMsg(msg) {
      work(msg, (ok) => {
        try {
          console.log(msg.fields); // sample output below
          // {
          //     consumerTag: 'amq.ctag-mtUCa8yio1I9jDTO7Ub0aQ',
          //     deliveryTag: 2,
          //     redelivered: false || true,
          //     exchange: '',
          //     routingKey: 'publisher_queue'
          //   }

          if (msg.fields.redelivered === true && qAttemps === 3) {
            qAttemps = 1;

            // nack and don't requeue
            ch.nack(msg, false, false);
            console.log('TERMINATE : queue has been purged');
          } else if (ok) {
            ch.ack(msg);
            qAttemps = 1;
          } else {
            // nack and requeue
            // ch.nack(msg, false, true);
            ch.reject(msg, true);
            qAttemps += 1;
          }


          //
        } catch (e) {
          closeOnErr(e, conn);
        }
      });
    }

    const exchange = 'publisher_queue';
    // const routingKey = 'info';

    ch.prefetch(1);
    ch.assertQueue(exchange, { durable: true }, (err2, _ok) => {
      if (closeOnErr(err2, conn)) return;
      ch.consume(exchange, processMsg, { noAck: false });

      console.log('start consume publisher');
    });
  });
}

exports.consumeRabbitPublisherConfirms = async () => {
  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}?heartbeat=60`, (err, conn) => {
    if (err) {
      console.error('[AMQP]', err.message);
      return setTimeout(this.startRabbitPublisherConfirms, 1000);
    }

    conn.on('error', (err2) => {
      if (err2.message !== 'Connection closing') {
        console.error('[AMQP] conn error', err2.message);
      }
    });

    conn.on('close', () => {
      console.error('[AMQP] reconnecting');
      return setTimeout(this.startRabbitPublisherConfirms, 1000);
    });

    // check feature confirmChannel
    // conn.createConfirmChannel((err, ch) => {
    //     ch.
    // })

    startConsume(conn);
  });
};
