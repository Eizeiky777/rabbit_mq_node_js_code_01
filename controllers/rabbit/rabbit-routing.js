/* eslint-disable no-console */
const amqp = require('amqplib/callback_api');
const { config } = require('../../config/rabbit_config');

exports.routingRabbit = async (req, res) => {
  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}`, (error0, connection) => {
    if (error0) {
      throw error0;
    }

    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }

      const exchange = 'direct_logs';
      const args = ['info', 'warning', 'error']; // name list routing
      const msg = 'Hello World Routing!';
      const severity = (args.length > 0) ? args[0] : 'info';

      channel.assertExchange(exchange, 'direct', {
        durable: false,
      });
      channel.publish(exchange, severity, Buffer.from(msg));
      console.log(" [x] Sent %s: '%s'", severity, msg);
    });

    //
  });

  const data = {
    status: 200,
  };

  res.send(data);
};
