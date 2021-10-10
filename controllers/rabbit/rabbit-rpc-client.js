/* eslint-disable no-console */
const amqp = require('amqplib/callback_api');
const { config } = require('../../config/rabbit_config');

function generateUuid() {
  return Math.random().toString() + Math.random().toString() + Math.random().toString();
}

exports.rpcClientRabbit = async (req, res) => {
  const args = [30];

  if (args.length === 0) {
    console.log('Usage: rpc_client.js num');
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

      channel.assertQueue('', {
        exclusive: true,
      }, (error2, q) => {
        if (error2) {
          throw error2;
        }

        const queue = 'rpc_queue';
        const correlationId = generateUuid();
        const num = parseInt(args[0], 10);

        console.log(' [x] Requesting fib(%d)', num);

        channel.consume(q.queue, (msg) => {
          if (msg.properties.correlationId === correlationId) {
            console.log(' [.] Got %s', msg.content.toString());
          }
        }, {
          noAck: true,
        });

        channel.sendToQueue(queue,
          Buffer.from(num.toString()), {
            correlationId,
            replyTo: q.queue,
          });
      });
    });
  });


  const data = {
    status: 200,
  };

  res.send(data);
};
