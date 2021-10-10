/* eslint-disable no-console */
const http = require('http');
const app = require('./app');

// const { env } = process;
// const svc = env.SVC_NAME || 'Rabbit';
// const host = env.HOST || 'localhost';
const port = 1111;

const server = http.createServer(app);
server.listen(port, () => console.log('\n Server Running Well', port, '\n'));
