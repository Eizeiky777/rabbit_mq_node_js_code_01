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

function startPublisher(conn) {
  conn.createConfirmChannel((err, ch) => {
    if (closeOnErr(err, conn)) return;

    ch.on('error', (err2) => {
      console.error('[AMQP] channel error', err2.message);
    });

    ch.on('close', () => {
      console.log('[AMQP] channel closed');
    });

    const exchange = '';
    const routingKey = 'publisher_queue';
    const content = Buffer.from('Hello word test ');

    console.log('start send publisher');


    ch.publish(exchange, routingKey, content, { persistent: true },
      (err2, ok) => {
        if (err2) {
          console.error('[AMQP] publish', err2);
          ch.connection.close();
        }
      });
  });
}

exports.startRabbitPublisherConfirms = async (req, res) => {
  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}`, (err, conn) => {
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

    startPublisher(conn);
  });

  const data = {
    status: 200,
  };

  res.send(data);
};
