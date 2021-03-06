export function getSettlements(cfdInstance) {
  return new Promise(((resolve, reject) => {
    cfdInstance.LogCfdSettled({}, { fromBlock: 0, toBlock: 'latest' }).get(
      (error, settlements) => {
        if (error) {
          reject(error);
        } else {
          resolve(
            settlements.map(
              settlement => ({
                transaction: settlement.transactionHash,
                cfdId: settlement.args.cfdId.toNumber(),
                makerAddress: settlement.args.makerAddress,
                takerAddress: settlement.args.takerAddress,
                amount: settlement.args.amount.dividedBy('1e18').toNumber(),
                startPrice: settlement.args.startPrice.dividedBy('1e18').toNumber(),
                endPrice: settlement.args.endPrice.dividedBy('1e18').toNumber(),
                makerSettlement: settlement.args.makerSettlement.dividedBy('1e18').toNumber(),
                takerSettlement: settlement.args.takerSettlement.dividedBy('1e18').toNumber(),
              }),
            ),
          );
        }
      },
    );
  }));
}

export const assets = [
  { value: '0', label: 'TSLA' },
  { value: '1', label: 'FB' },
  { value: '2', label: 'AMZN' },
  { value: '3', label: 'AAPL' },
  { value: '4', label: 'GOOGL' },
  { value: '5', label: 'S&P 500' },
];

export function assetIdToString(assetId) {
  const assetMatch = assets.find(asset => asset.value === assetId.toString());
  return assetMatch ? assetMatch.label : assetId;
}
