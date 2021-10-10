/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable no-console */
const amqplib = require('amqplib');
const Broker = require('rascal').BrokerAsPromised;
const config = require('../../config-rascal.json');

const amqp_url = process.env.CLOUDAMQP_URL || 'amqp://guest:guest@localhost:5672/';

exports.rascal_produce = async (req, res) => {
  console.log(' [0001] rascal: Publishing');
  const msg = 'Hello rascal World!';

  const broker = await Broker.create(config);
  broker.on('error', console.error);

  const publication = await broker.publish('demo_publication', req.files);
  publication.on('error', console.error);

  console.log(' [0200] rascal: Published');

  res.send({ status: 200, message: 'rascal produce' });
};

exports.produce = async (req, res) => {
  console.log('amqplib: Publishing');
  const conn = await amqplib.connect(amqp_url, 'heartbeat=60');
  const ch = await conn.createChannel();

  const exch = 'test_exchange';
  const q = 'test_queue';
  const rkey = 'test_route';
  const msg = 'Hello amqplib World!';

  await ch.assertExchange(exch, 'direct', { durable: true }).catch(console.error);
  await ch.assertQueue(q, { durable: true });
  await ch.bindQueue(q, exch, rkey);
  await ch.publish(exch, rkey, Buffer.from(msg));

  setTimeout(() => {
    ch.close();
    conn.close();
  }, 500);

  res.send({ status: 200, message: 'rascal produce' });
};

// async function main() {
//   await rascal_produce().catch(console.error);
//   await rascal_consume().catch(console.error);
//   await produce().catch(console.error);
//   await consume().catch(console.error);
// }

// main();
