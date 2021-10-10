/* eslint-disable no-console */
const args = process.argv.slice(2).join(' '); // convert to string


console.log(args);

// run => node testing.js kern.#

// result =>
// [
//   'C:\\Program Files\\nodejs\\node.exe',
//   'C:\\1_Meteor\\_10_research\\rabbit_mq\\testing.js',
//   'kern.#'
// ]
