/* eslint-disable no-console */
const amqp = require('amqplib/callback_api');

// config rabbitmq
const config = {
  scheme: 'amqp',
  host: 'localhost',
  port: 5672,
  user: 'guest',
  pass: 'guest',
  vhost: '/',
};

exports.hello_world = async () => {
  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}`, (error0, connection) => {
    if (error0) {
      throw error0;
    }
    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }

      const queue = 'multi_images';

      channel.assertQueue(queue, {
        durable: false,
      });

      console.log(' [0001] Waiting for message. To exit press CTRL+C', queue);

      channel.consume(queue, (msg) => {
        console.log(' [RECEIVED] >>>>>>>>>> Received %s', typeof msg.content);
        console.log(' [RECEIVED] >>>>>>>>>> Received %s', msg.content);
      }, {
        noAck: true,
      });
    });
  });
};

exports.work_queues = async () => {
  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}`, (error0, connection) => {
    connection.createChannel((error, channel) => {
      const queue = 'task_queue';

      channel.assertQueue(queue, {
        durable: true,
      });

      channel.prefetch(1);
      console.log(' [0002] Waiting for messages in %s. To exit press CTRL+C', queue);

      channel.consume(queue, (msg) => {
        const secs = msg.content.toString().split('.').length - 1;

        console.log(' [RECEIVED] >>>>>>>>>> Received %s', msg.content.toString());

        setTimeout(() => {
          console.log(' [x] Done');
          channel.ack(msg);
        }, secs * 1000);
      }, {
        noAck: false,
      });
    });
  });
};
