/** 
 * A simple tool for time management in truffle testrpc tests
 * 
 * wait will wait for `n` blocks; (seconds, blocks), default (20, 1)
 * waitUntilBlock will wait until `n` specific block; (seconds, blockNumber)
 * 
 * const { wait, waitUntilBlock } = require('@digix/tempo')(web3);
 * 
 * contract('MockLibraryUser', function () {
 *   it('get_last_payment_date returns correct time when its not set', async function () {
 *     const mockLibraryUser = await MockLibraryUser.deployed();
 *     await mockLibraryUser.create_user(testUser);
 *     const lastPayment1 = await mockLibraryUser.get_last_payment_date.call(testUser);
 *     const timeDiff1 = new Date().getTime() - (lastPayment1.toNumber() * 1000);
 *     assert.ok(timeDiff1 < 1000, 'unset date isnt `now`');
 *     await wait();
 *   });
 * });
**/

module.exports = (web3) => {
  function sendRpc(method, params) {
    return new Promise((resolve) => {
      web3.currentProvider.sendAsync({
        jsonrpc: '2.0',
        method,
        params: params || [],
        id: new Date().getTime(),
      }, (err, res) => { resolve(res); });
    });
  }
  
  function waitUntilBlock(seconds, targetBlock) {
    return new Promise((resolve) => {
      const asyncIterator = () => {
        return web3.eth.getBlock('latest', (e, { number }) => {
          if (number >= targetBlock - 1) {
            return sendRpc('evm_increaseTime', [seconds])
            .then(() => sendRpc('evm_mine')).then(resolve);
          }
          return sendRpc('evm_mine').then(asyncIterator);
        });
      };
      asyncIterator();
    });
  }
  
  function wait(seconds = 20, blocks = 1) {
    return new Promise((resolve) => {
      return web3.eth.getBlock('latest', (e, { number }) => {
        resolve(blocks + number);
      });
    })
    .then((targetBlock) => {
      return waitUntilBlock(seconds, targetBlock);
    });
  }

  return { wait, waitUntilBlock };
};