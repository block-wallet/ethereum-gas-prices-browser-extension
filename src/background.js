/* eslint-disable no-use-before-define */

import {
  getBlocknativeData,
  getEtherscanData,
  getEGSData,
  debounce,
} from "./utils.js";

const DECIMALS_WEI = 1e18;
const DECIMALS_GWEI = 1e9;

chrome.alarms.onAlarm.addListener(async ({ name }) => {
  if (name === "fetch-prices") fetchPrices();
});

// Check whether extension has just been installed
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason == "install") {
    chrome.tabs.create({ url: "introduction.html" });
  }
});

chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === "local" && changes.prices) {
    const prices = changes.prices.newValue;
    const badgeSource = await getStoredBadgeSource();

    updateBadgeValue({ prices, badgeSource });
  }

  if (areaName === "local" && changes.badgeSource) {
    const prices = await getStoredPrices();
    const badgeSource = changes.badgeSource.newValue;

    updateBadgeValue({ prices, badgeSource });
  }
});

const updateBadgeValue = ({ prices, badgeSource }) => {
  const [preferredProvider, preferredSpeed] = badgeSource.split("|");

  const value =
    prices[preferredProvider][preferredSpeed] ||
    prices.blocknative[preferredSpeed] ||
    prices.etherscan[preferredSpeed] ||
    prices.egs[preferredSpeed];

  if (value) {
    chrome.action.setBadgeText({
      text: `${Math.trunc(value)}`,
    });
  }
};

const sleep = (duration) =>
  new Promise((resolve) => setTimeout(resolve, duration));
const lock = {
  state: {
    isLocked: false,
  },

  // Wait and acquire lock
  async acquire() {
    while (this.state.isLocked) {
      await sleep(100); // eslint-disable-line no-await-in-loop
    }

    this.state.isLocked = true;
  },

  release() {
    this.state.isLocked = false;
  },
};

const getStoredBadgeSource = () =>
  new Promise((res) => {
    chrome.storage.local.get(["badgeSource"], (result) => {
      const defaultBadgeSource = "blocknative|1";
      res((result && result.badgeSource) || defaultBadgeSource);
    });
  });

const setStoredBadgeSource = async (badgeSource) =>
  new Promise((res) => {
    chrome.storage.local.set({ badgeSource }, () => res());
  });

const getStoredPrices = () =>
  new Promise((res) => {
    chrome.storage.local.get(["prices"], (result) => {
      res({
        blocknative: (result && result.prices && result.prices.blocknative) || [
          null,
          null,
          null,
        ],
        etherscan: (result && result.prices && result.prices.etherscan) || [
          null,
          null,
          null,
        ],
        egs: (result && result.prices && result.prices.egs) || [
          null,
          null,
          null,
        ],
        blocknative1559: (result &&
          result.prices &&
          result.prices.blocknative1559) || [null, null, null],
      });
    });
  });

const setStoredPrices = async (prices) =>
  new Promise((res) => {
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

const fetchPrices = () => {
  fetchBlocknativeData()
    .catch((err) => {
      console.error(err);

      return [
        [null, null, null],
        [null, null, null],
      ];
    }) // Default to null if network error
    .then(([prices, prices1559]) => {
      saveFetchedPricesForProvider("blocknative1559", prices1559);
      saveFetchedPricesForProvider("blocknative", prices);
    });

  fetchEtherscanData()
    .catch((err) => {
      console.error(err);

      return [null, null, null];
    }) // Default to null if network error
    .then((prices) => saveFetchedPricesForProvider("etherscan", prices));

  fetchEGSData()
    .catch((err) => {
      console.error(err);

      return [null, null, null];
    }) // Default to null if network error
    .then((prices) => saveFetchedPricesForProvider("egs", prices));
};

const fetchBlocknativeData = debounce(async () => {
  const response = await getBlocknativeData();

  const estimatedPrices = response.blockPrices[0].estimatedPrices;

  const fastest = estimatedPrices.find(({ confidence }) => confidence === 99);
  const fast = estimatedPrices.find(({ confidence }) => confidence === 90);
  const standard = estimatedPrices.find(({ confidence }) => confidence === 80);
  const slow = estimatedPrices.find(({ confidence }) => confidence === 60);

  return [
    [fast.price, standard.price, slow.price],
    [
      [fast.maxPriorityFeePerGas, fast.maxFeePerGas],
      [standard.maxPriorityFeePerGas, standard.maxFeePerGas],
      [slow.maxPriorityFeePerGas, slow.maxFeePerGas],
    ],
  ];
});

const fetchEtherscanData = debounce(async () => {
  const {
    result: { SafeGasPrice, ProposeGasPrice, FastGasPrice },
  } = await getEtherscanData();

  return [
    parseInt(FastGasPrice, 10),
    parseInt(ProposeGasPrice, 10),
    parseInt(SafeGasPrice, 10),
  ];
});

const fetchEGSData = debounce(async () => {
  const { fast, safeLow, average } = await getEGSData();

  return [fast / 10, average / 10, safeLow / 10];
});

chrome.alarms.create("fetch-prices", { periodInMinutes: 1 });
fetchPrices(); // Not using the `when` option for the alarm because Firefox doesn't run it

// Set initial properties when the extension launches; since this isn't
// a persistent background script, it may be regularly shut down and initialized
// again: testing for the value of text allows to only apply initia value on the
// first initialization
chrome.action.getBadgeText({}, (text) => {
  const isInitialRun = text === "";
  if (isInitialRun) chrome.action.setBadgeText({ text: "…" });
});
chrome.action.setBadgeBackgroundColor({ color: "#4db8ff" });

chrome.runtime.onMessage.addListener(({ action, ...data } = {}) => {
  if (action === "refresh-data") fetchPrices();
  if (action === "update-badge-source") setStoredBadgeSource(data.badgeSource);
});
