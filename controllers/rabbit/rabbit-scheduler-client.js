/* eslint-disable max-len */
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

const amqp = require('amqplib/callback_api');
const { config } = require('../../config/rabbit_config');

function closeOnErr(err, amqpConn) {
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

// A worker that acks messages only if processed succesfully
exports.consumeRabbitDelay = () => {
  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}?heartbeat=60`, (err, conn) => {
    conn.createChannel((createErr, ch) => {
      if (closeOnErr(createErr, conn)) return;
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
