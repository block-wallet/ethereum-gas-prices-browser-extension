const refreshButtonEl = document.querySelector('#refresh-button');

const getStoredPrices = () => new Promise((res) => {
  chrome.storage.local.get(['prices'], (result) => {
    res({
      gasNow: (result && result.prices && result.prices.gasNow) || [null, null, null],
      etherscan: (result && result.prices && result.prices.etherscan) || [null, null, null],
      egs: (result && result.prices && result.prices.egs) || [null, null, null],
    });
  });
});

const formatPrice = (price) => (price === null ? '...' : Math.trunc(price));

const updateDOMForProvider = (provider, prices) => {
  document.querySelector(`#${provider} .fast`).textContent = formatPrice(prices[provider][0]);
  document.querySelector(`#${provider} .normal`).textContent = formatPrice(prices[provider][1]);
  document.querySelector(`#${provider} .slow`).textContent = formatPrice(prices[provider][2]);

  const hasData = (
    prices[provider][0] !== null &&
    prices[provider][1] !== null &&
    prices[provider][2] !== null
  );

  document.querySelector(`#${provider} .timestamp`)
    .setAttribute('data-timestamp', hasData ? prices[provider][3] : '');
};

const updateDOM = (prices) => {
  updateDOMForProvider('gasNow', prices);
  updateDOMForProvider('etherscan', prices);
  updateDOMForProvider('egs', prices);

  if (refreshButtonEl.getAttribute('data-content-loaded') !== 'true') {
    refreshButtonEl.setAttribute('data-content-loaded', 'true');
  }
};

const updateTimestampDisplayDOM = (el) => {
  const timestampNow = Math.trunc(+Date.now() / 1000);
  const timestampThen = el.getAttribute('data-timestamp');

  if (timestampThen) {
    const secDiff = timestampNow - timestampThen;
    const diffText = secDiff === 0 ? 'just now' : `${secDiff}s ago`;

    el.textContent = diffText; // eslint-disable-line no-param-reassign
  } else {
    el.textContent = ''; // eslint-disable-line no-param-reassign
  }
};

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.prices) {
    const newPrices = changes.prices.newValue;
    updateDOM(newPrices);
  }
});

const timestampEls = document.querySelectorAll('.timestamp');
const updateTimestampDisplay = () => timestampEls.forEach((el) => updateTimestampDisplayDOM(el));
setInterval(updateTimestampDisplay, 500);

getStoredPrices()
  .then((prices) => updateDOM(prices))
  .then(() => updateTimestampDisplay());

refreshButtonEl.addEventListener('click', () => {
  if (refreshButtonEl.getAttribute('data-content-loaded') === 'true') {
    refreshButtonEl.setAttribute('data-content-loaded', 'false');
    chrome.runtime.sendMessage({ action: 'refresh-data' });
  }
});
