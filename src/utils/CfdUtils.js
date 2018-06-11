export function getSettlements(cfdInstance) {
  return new Promise(function (resolve, reject) {
    cfdInstance.LogCfdSettled({}, { fromBlock: 0, toBlock: 'latest' }).get(
      (error, settlements) => {
        if (error) {
          reject(error)
        } else {
          resolve(
            settlements.map(
              (settlement) => {
                return {
                  cfdId: settlement.args.cfdId.toNumber(),
                  makerAddress: settlement.args.makerAddress,
                  takerAddress: settlement.args.takerAddress,
                  amount: settlement.args.amount.dividedBy('1e18').toNumber(),
                  startPrice: settlement.args.startPrice.dividedBy('1e18').toNumber(),
                  endPrice: settlement.args.endPrice.dividedBy('1e18').toNumber(),
                  makerSettlement: settlement.args.makerSettlement.dividedBy('1e18').toNumber(),
                  takerSettlement: settlement.args.takerSettlement.dividedBy('1e18').toNumber()
                }
              }
            )
          )
        }
      }
    )
  })
}