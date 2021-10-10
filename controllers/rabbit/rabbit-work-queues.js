/* eslint-disable no-console */
/* eslint-disable no-unused-vars */

const amqp = require('amqplib/callback_api');

const config = {
  scheme: 'amqp',
  host: 'localhost',
  port: 5672,
  user: 'guest',
  pass: 'guest',
  vhost: '/',
};

const worker0001 = async () => {
  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}`, (error0, connection) => {
    if (error0) {
      throw error0;
    }

    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }

      const queue = 'task_queue';
      const msg = process.argv.slice(2).join(' ') || 'Hello...';

      channel.assertQueue(queue, {
        durable: true,
      });
      channel.sendToQueue(queue, Buffer.from(msg), {
        persistent: true,
      });
      console.log(" [x] Sent '%s'", msg);
    });

    console.log('[SENDING DURABLE QUEUE]');
  });
};

exports.execWorker = async (req, res) => {
  // start send durable queue
  worker0001();
  // worker0002(req);
  // ...dst

  const data = {
    status: 200,
  };

  res.send(data);
};
