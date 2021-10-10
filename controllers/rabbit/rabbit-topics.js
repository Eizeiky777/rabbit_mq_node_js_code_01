/* eslint-disable no-console */
const amqp = require('amqplib/callback_api');
const { config } = require('../../config/rabbit_config');

exports.topicRabbit = async (req, res) => {
  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}`, (error0, connection) => {
    if (error0) {
      throw error0;
    }
    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }
      const exchange = 'topic_logs';
      const args = ['kern.normal'];
      const key = (args.length > 0) ? args[0] : 'anonymous.info';
      const msg = 'Hello World Topic !';

      channel.assertExchange(exchange, 'topic', {
        durable: false,
      });
      channel.publish(exchange, key, Buffer.from(msg));
      console.log(" [x] Sent %s:'%s'", key, msg);
    });
  });

  const data = {
    status: 200,
  };

  res.send(data);
};
