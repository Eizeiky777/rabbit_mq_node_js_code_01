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

exports.publishSubscribe = async (req, res) => {
  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}`, (error0, connection) => {
    if (error0) {
      throw error0;
    }
    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }
      const exchange = 'logs';
      const msg = process.argv.slice(2).join(' ') || 'Hello World!';

      channel.assertExchange(exchange, 'fanout', {
        durable: false,
      });

      channel.publish(exchange, '', Buffer.from(msg));
      console.log(' [x] Sent %s', msg);
    });
  });

  const data = {
    status: 200,
  };

  res.send(data);
};
