/* eslint-disable no-use-before-define */

const DECIMALS_WEI = 1e18;
const DECIMALS_GWEI = 1e9;

chrome.alarms.onAlarm.addListener(async ({ name }) => {
  if (name === 'fetch-prices') fetchPrices();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.prices) {
    const newPrices = changes.prices.newValue;

    const value = (
      newPrices.gasNow[1] ||
      newPrices.etherscan[1] ||
      newPrices.egs[1]
    );

    if (value) {
      chrome.browserAction.setBadgeText({
        text: `${Math.trunc(value)}`,
      });
    }
  }
});

const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
const lock = new (class Lock {
  state = {
    isLocked: false,
  };

  // Wait and acquire lock
  async acquire() {
    while (this.state.isLocked) {
      await sleep(100); // eslint-disable-line no-await-in-loop
    }

    this.state.isLocked = true;
  }

  release() {
    this.state.isLocked = false;
  }
})();

const getStoredPrices = () => new Promise((res) => {
  chrome.storage.local.get(['prices'], (result) => {
    res({
      gasNow: (result && result.prices && result.prices.gasNow) || [null, null, null],
      etherscan: (result && result.prices && result.prices.etherscan) || [null, null, null],
      egs: (result && result.prices && result.prices.egs) || [null, null, null],
    });
  });
});

const setStoredPrices = async (prices) => new Promise((res) => {
  chrome.storage.local.set({ prices }, () => res());
});

const saveFetchedPricesForProvider = async (source, prices) => {
  await lock.acquire();

  const storedPrices = await getStoredPrices();
  const timestamp = Math.trunc(+Date.now() / 1000);

  await setStoredPrices({
    ...storedPrices,
    [source]: prices.concat(timestamp),
  });

  lock.release();
};

const fetchPrices = async () => {
  await fetchGasNowData().then((prices) => saveFetchedPricesForProvider('gasNow', prices));
  await fetchEtherscanData().then((prices) => saveFetchedPricesForProvider('etherscan', prices));
  await fetchEGSData().then((prices) => saveFetchedPricesForProvider('egs', prices));
};

const fetchGasNowData = async () => {
  const { data: { list } } =
    await (await fetch('https://ethereum-data.unspent.io/api/gasnow')).json();

  return [200, 500, 1000].map((index) => {
    const priceForIndex = list.find((estimation) => estimation.index === index);
    return priceForIndex ?
      priceForIndex.gasPrice / DECIMALS_WEI * DECIMALS_GWEI :
      null;
  });
};

const fetchEtherscanData = async () => {
  const { result: { SafeGasPrice, ProposeGasPrice, FastGasPrice } } =
    await (await fetch('https://ethereum-data.unspent.io/api/etherscan-gas')).json();

  return [
    parseInt(FastGasPrice, 10),
    parseInt(ProposeGasPrice, 10),
    parseInt(SafeGasPrice, 10),
  ];
};

const fetchEGSData = async () => {
  const { fast, safeLow, average } =
    await (await fetch('https://ethereum-data.unspent.io/api/ethgasstation')).json();

  return [fast / 10, average / 10, safeLow / 10];
};


chrome.alarms.create('fetch-prices', { when: 0, periodInMinutes: 1 });
chrome.browserAction.setBadgeText({ text: '…' });
chrome.browserAction.setBadgeBackgroundColor({ color: '#20242a' });

chrome.runtime.onMessage.addListener(({ action } = {}) => {
  if (action === 'refresh-data') fetchPrices();
});
