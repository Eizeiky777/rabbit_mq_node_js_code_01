// exports.subscribers = async () => {
//   try {
//     const subscription = await broker.subscribe('my_subscriber');
//     subscription.on('message', (message, content, ackOrNack) => {
//       // handle message
//     }).on('invalid_content', (err, message, ackOrNack) => {
//       // handle message with invalid content
//     });
//   } catch (err) {
//     console.error('Subscription does not exist');
//   }

// };
