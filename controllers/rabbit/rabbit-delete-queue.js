/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const sys = require('util');
const amqp = require('amqplib/callback_api');

// Simply publish a message to a direct exchange.

const { inspect } = sys;
const { puts } = sys;

const config = {
  scheme: 'amqp',
  host: 'localhost',
  port: 5672,
  user: 'guest',
  pass: 'guest',
  vhost: '/',
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

exports.deleteRabbitQueue = async (req, res) => {
  if (req.body.name) deleteQueue(req);
  else return { status: 400, message: 'missing parameter delete_queue name' };

  const data = { status: 200 };
  return res.send(data);
};
