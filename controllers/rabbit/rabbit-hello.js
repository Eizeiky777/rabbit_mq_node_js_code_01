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

// SEND QUEUE
const startSendQueue = (req) => {
  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}`, (error0, connection) => {
    if (error0) { throw error0; }
    connection.createChannel((error1, channel) => {
      if (error1) { throw error1; }


      const msg = 'Hello World!';


      if (req.files && req.files.length) {
        const queue = 'multi_images';
        channel.assertQueue(queue, { durable: false });
        req.files.forEach((e) => {
          channel.sendToQueue(queue, Buffer.from(JSON.stringify(e)));
        });
      } else {
        const queue = 'single_notes';
        channel.assertQueue(queue, { durable: false });
        channel.sendToQueue(queue, Buffer.from(msg));
      }

      console.log('[SENDING QUEUE]');
    });
  });
};

// DELETE QUEUE
const deleteQueue = async (req) => {
  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}`, (error0, connection) => {
    if (error0) { throw error0; }
    connection.createChannel((error1, channel) => {
      if (error1) { throw error1; }
      channel.deleteQueue(req.body.delete_queue_name);
    });

    console.log('[DELETE QUEUE]');
  });
};


exports.send = async (req, res) => {
  // start rabbit
  if (req.body.delete_queue_name === undefined) startSendQueue(req);

  // delete rabbit
  if (req.body.delete_queue_name) deleteQueue(req);


  const data = {
    status: 200,
  };

  res.send(data);
};
