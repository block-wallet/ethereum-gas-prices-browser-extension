const DECIMALS_WEI = 1e18;
const DECIMALS_GWEI = 1e9;

let inMemStoredPrices; // Used for faster (synchronous) access to stored prices

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

const getStoredPrices = () => new Promise((res) => {
  if (inMemStoredPrices) {
    res(inMemStoredPrices);
  } else {
    chrome.storage.local.get(['prices'], (result) => {
      res({
        gasNow: (result && result.gasNow) || [null, null, null],
        etherscan: (result && result.etherscan) || [null, null, null],
        egs: (result && result.egs) || [null, null, null],
      });
    });
  }
});

const setStoredPrices = async (prices) => new Promise((res) => {
  inMemStoredPrices = prices;
  chrome.storage.local.set({ prices }, () => res());
});

const saveFetchedPricesForProvider = async (source, prices) => {
  const storedPrices = await getStoredPrices();
  const timestamp = Math.trunc(+Date.now() / 1000);

  await setStoredPrices({
    ...storedPrices,
    [source]: prices.concat(timestamp),
  });
};

const fetchPrices = async () => {
  await fetchGasNowData().then((prices) => saveFetchedPricesForProvider('gasNow', prices));
  await fetchEtherscanData().then((prices) => saveFetchedPricesForProvider('etherscan', prices));
  await fetchEGSData().then((prices) => saveFetchedPricesForProvider('egs', prices));
};

const fetchGasNowData = async () => {
  // Uses self-hosted proxy to work around CORS header not set on GasNow API responses
  const { data: { list } } =
    await (await fetch('https://ethereum-data.opfi.fr/api/gasnow')).json();

  return [200, 500, 1000].map((index) => {
    const priceForIndex = list.find((estimation) => estimation.index === index);
    return priceForIndex ?
      priceForIndex.gasPrice / DECIMALS_WEI * DECIMALS_GWEI :
      null;
  });
};

const fetchEtherscanData = async () => {
  const { result: { SafeGasPrice, ProposeGasPrice, FastGasPrice } } =
    await (await fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle')).json();

  return [parseInt(FastGasPrice), parseInt(ProposeGasPrice), parseInt(SafeGasPrice)];
};

const fetchEGSData = async () => {
  const { fast, safeLow, average } =
    await (await fetch('https://ethgasstation.info/api/ethgasAPI.json')).json();

  return [fast / 10, average / 10, safeLow / 10];
};


chrome.alarms.create('fetch-prices', { when: 0, periodInMinutes: 1 });
chrome.browserAction.setBadgeText({ text: '…' });
chrome.browserAction.setBadgeBackgroundColor({ color: '#20242a' });

chrome.runtime.onMessage.addListener(({ action } = {}) => {
  if (action === 'refresh-data') fetchPrices();
});
