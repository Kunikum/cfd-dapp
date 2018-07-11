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

function sendRpc(method, params, web3) {
  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method,
      params,
      id: new Date().getTime(),
    }, (err, res) => {
      return err ? reject(err) : resolve(res);
    });
  })
}

export async function waitUntilBlock(targetBlock, web3) {
  let currentBlock = await web3.eth.getBlockNumber();
  while (currentBlock < targetBlock) {
    await sendRpc('evm_increaseTime', [15], web3);
    await sendRpc('evm_mine', [], web3);
    currentBlock = await web3.eth.getBlockNumber();
  }
}