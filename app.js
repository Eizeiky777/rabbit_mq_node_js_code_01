/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
/* eslint-disable no-console */

require('dotenv').config();
const sys = require('util');

const express = require('express');
const cors = require('cors');

const amqp = require('amqplib/callback_api');
const amqplib = require('amqplib');
const Broker = require('rascal').BrokerAsPromised;

const RabbitConsume = require('./controllers/rabbit/rabbit-consume');
const RabbitRpcServer = require('./controllers/rabbit/rabbit-rpc-server');
const RabbitSchedulerClient = require('./controllers/rabbit/rabbit-scheduler-client');
const RabbitPublisherConfirmsClient = require('./controllers/rabbit/rabbit-publisher-confirms-client');

const RascalProduce = require('./controllers/rascal/rascal-produce');
const RascalConsume = require('./controllers/rascal/rascal-consume');


const { env } = process;
const { inspect } = sys;
const { puts } = sys;


const configRascal = require('./config-rascal.json');
const router = require('./routes/api');

const amqp_url = process.env.CLOUDAMQP_URL || 'amqp://guest:guest@localhost:5672/';

const app = express();
app.enable('trust proxy');

// cors
app.use(cors());

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(router);


// ========================================================= CONSUMER ======================================= //
// uncomment bellow to activating consume position //

// RABBIT
// RabbitConsume.hello_world();
// RabbitConsume.work_queues();
// RabbitConsume.publish_subscribe();
// RabbitConsume.routingRabbit();
// RabbitConsume.topicRabbit();

// RPC
// RabbitConsume.rpcServerRabbit();

// PUBLISHER CONFIRMS
// RabbitPublisherConfirmsClient.consumeRabbitPublisherConfirms();

// SCHEDULER
// RabbitSchedulerClient.consumeRabbitDelay();

// RASCAL
// RascalConsume.rascal_consume();

// RascalConsume.consume();


module.exports = app;
