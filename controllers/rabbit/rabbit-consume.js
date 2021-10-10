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

      const queues = ['multi_images', 'single_notes'];

      queues.forEach((queue) => {
        channel.assertQueue(queue, {
          durable: false,
        });
        channel.consume(queue, (msg) => {
          console.log(' [RECEIVED] >>>>>>>>>> Queue %s ', `"${queue}"`);
          console.log(' [RECEIVED] >>>>>>>>>> Received %s ', typeof msg.content);
          console.log(' [RECEIVED] >>>>>>>>>> Received %s ', msg.content);
        }, {
          noAck: true,
        });
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
      console.log('[0002] Waiting for messages in %s. To exit press CTRL+C', queue);

      channel.consume(queue, (msg) => {
        const secs = msg.content.toString().split('.').length - 1; // just say its total number of data

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

exports.publish_subscribe = async () => {
  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}`, (error0, connection) => {
    if (error0) {
      throw error0;
    }

    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }

      const exchange = 'logs';

      channel.assertExchange(exchange, 'fanout', {
        durable: false,
      });

      channel.assertQueue('', {
        exclusive: true,
      }, (error2, q) => {
        if (error2) {
          throw error2;
        }

        console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', q.queue);
        channel.bindQueue(q.queue, exchange, '');

        channel.consume(q.queue, (msg) => {
          if (msg.content) {
            console.log(' [x] %s', msg.content.toString());
          }
        }, {
          noAck: true,
        });

        //
      });
    });

    //
  });
};

exports.routingRabbit = () => {
  const args = ['info', 'warning', 'error'];

  if (args.length === 0) {
    console.log('Usage: receive_logs_direct.js [info] [warning] [error]');
    process.exit(1);
  }

  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}`, (error0, connection) => {
    if (error0) {
      throw error0;
    }
    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }
      const exchange = 'direct_logs';

      channel.assertExchange(exchange, 'direct', {
        durable: false,
      });

      channel.assertQueue('', {
        exclusive: true,
      }, (error2, q) => {
        if (error2) {
          throw error2;
        }
        console.log(' [*] Waiting for logs. To exit press CTRL+C');

        args.forEach((severity) => {
          channel.bindQueue(q.queue, exchange, severity);
        });

        channel.consume(q.queue, (msg) => {
          console.log(" [x] receive routing %s: '%s'", msg.fields.routingKey, msg.content.toString());
        }, {
          noAck: true,
        });
      });

      //
    });

    //
  });

  //
};

exports.topicRabbit = () => {
  const args = ['kern.*'];

  if (args.length === 0) {
    console.log('Usage: receive_logs_topic.js <facility>.<severity>');
    process.exit(1);
  }

  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}`, (error0, connection) => {
    if (error0) {
      throw error0;
    }

    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }
      const exchange = 'topic_logs';

      channel.assertExchange(exchange, 'topic', {
        durable: false,
      });

      channel.assertQueue('', {
        exclusive: true,
      }, (error2, q) => {
        if (error2) {
          throw error2;
        }

        args.forEach((key) => {
          channel.bindQueue(q.queue, exchange, key);
        });

        channel.consume(q.queue, (msg) => {
          console.log(" [x] receive topic %s:'%s'", msg.fields.routingKey, msg.content.toString());
        }, {
          noAck: true,
        });
      });

      //
    });

    //
  });

  //
};

function fibonacci(n) {
  if (n === 0 || n === 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

exports.rpcServerRabbit = async () => {
  amqp.connect(`${config.scheme}://${config.user}:${config.pass}@${config.host}:${config.port}${config.vhost}`, (error0, connection) => {
    if (error0) {
      throw error0;
    }
    connection.createChannel((error1, channel) => {
      if (error1) {
        throw error1;
      }
      const queue = 'rpc_queue';

      channel.assertQueue(queue, {
        durable: false,
      });
      channel.prefetch(1);
      console.log(' [x] Awaiting Consume RPC requests');

      channel.consume(queue, (msg) => {
        const n = parseInt(msg.content.toString(), 10);

        console.log(' [.] fib(%d)', n);

        const r = fibonacci(n);

        channel.sendToQueue(msg.properties.replyTo,
          Buffer.from(r.toString()), {
            correlationId: msg.properties.correlationId,
          });
        channel.ack(msg);
      });
    });
  });
};
