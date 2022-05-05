const now = () => +Date.now() / 1000;

const memoizeAsync = (fn) => {
  const CACHE_DURATION = 10;

  let lastRunTs = 0;
  let cache;

  return async () => {
    const isCacheExpired = (now() - lastRunTs) > CACHE_DURATION;

    if (isCacheExpired) {
      lastRunTs = now();
      cache = await fn();
    }

    return cache;
  }
};

const debounce = (fn) => {
  let timeoutId;

  return () => new Promise((resolve) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => resolve(fn()), 500);
  });
};

const getBlocknativeData = memoizeAsync(async () => (
  (await fetch('https://opfi.fr/api/blocknative')).json()
));

const getEtherscanData = memoizeAsync(async () => (
  (await fetch('https://api.etherscan.io/api?module=gastracker&action=gasoracle')).json()
));

const getEGSData = memoizeAsync(async () => (
  (await fetch(`https://ethgasstation.info/api/ethgasAPI.json?api-key=3923e07fd996632e1fbc897c859aa90a1f604bab3a2c22efa2780109db6f`)).json()
));

const getEtherchainData = memoizeAsync(async () => (
  (await fetch(`https://www.etherchain.org/api/gasPriceOracle`)).json()
));

export {
  debounce,
  getBlocknativeData,
  getEtherscanData,
  getEGSData,
  getEtherchainData,
}
