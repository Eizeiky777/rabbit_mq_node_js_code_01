/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable no-console */
const amqplib = require('amqplib');
const Broker = require('rascal').BrokerAsPromised;
const config = require('../../config-rascal.json');

const amqp_url = process.env.CLOUDAMQP_URL || 'amqp://guest:guest@localhost:5672/';

exports.rascal_consume = async () => {
  console.log(' [0001] rascal: Consuming');

  const broker = await Broker.create(config);
  broker.on('error', console.error);

  const subscription = await broker.subscribe('demo_subscription', 'b1');
  subscription.on('message', (message, content, ackOrNack) => {
    console.log(` [0200] rascal: consumed message: ${content}`);
    ackOrNack();
    subscription.cancel();
  });

  subscription.on('error', console.error);
  subscription.on('invalid_content', (err, message, ackOrNack) => {
    console.log('Failed to parse message');
  });
};

exports.consume = async () => {
  console.log(' [0002] amqplib: Consuming');

  const conn = await amqplib.connect(amqp_url, 'heartbeat=60');
  const ch = await conn.createChannel();
  const q = 'test_queue';
  await conn.createChannel();
  await ch.assertQueue(q, { durable: true });

  await ch.consume(q, (msg) => {
    console.log(`amqplib: consumed message: ${msg.content.toString()}`);
    ch.ack(msg);
    ch.cancel('myconsumer');
  }, { consumerTag: 'myconsumer' });

  setTimeout(() => {
    ch.close();
    conn.close();
  }, 500);
};

// async function main() {
//   await rascal_produce().catch(console.error);
//   await rascal_consume().catch(console.error);
//   await produce().catch(console.error);
//   await consume().catch(console.error);
// }

// main();
