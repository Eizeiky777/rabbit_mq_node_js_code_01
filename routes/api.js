/* eslint-disable camelcase */
const express = require('express');
const multer = require('multer');
const { deleteRabbitQueue } = require('../controllers/rabbit/rabbit-delete-queue');

const { send } = require('../controllers/rabbit/rabbit-hello');
const { publishSubscribe } = require('../controllers/rabbit/rabbit-publish-subscribe');
const { startRabbitPublisherConfirms } = require('../controllers/rabbit/rabbit-publisher-confirms-server');
const { routingRabbit } = require('../controllers/rabbit/rabbit-routing');
const { rpcClientRabbit } = require('../controllers/rabbit/rabbit-rpc-client');
const { topicRabbit } = require('../controllers/rabbit/rabbit-topics');
const { execWorker } = require('../controllers/rabbit/rabbit-work-queues');
const { rascal_produce, produce } = require('../controllers/rascal/rascal-produce');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 } });

// RABBIT_MQ < stable >
router.post('/send_hello', upload.array('image', 5), send);
router.post('/send_hello_durable', upload.array('image', 5), execWorker);
router.post('/send_routing', upload.array('image', 5), routingRabbit);
router.post('/send_topic', upload.array('image', 5), topicRabbit);
router.post('/send_rpc', upload.array('image', 5), rpcClientRabbit);
router.post('/send_publisher', upload.array('image', 5), startRabbitPublisherConfirms);

// Publisher confirms < unstable >
router.post('/publish_subscribe', upload.array('image', 5), publishSubscribe);

// Delete queue
router.delete('/delete_queue', deleteRabbitQueue);


// RASCAL < stable >
router.post('/rascal_produce_hello', upload.array('image'), rascal_produce);
router.post('/produce_hello', upload.array('image'), produce);

module.exports = router;
