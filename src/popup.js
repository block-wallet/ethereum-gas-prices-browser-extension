const refreshButtonEl = document.querySelector('#refresh-button');

const getStoredPrices = () => new Promise((res) => {
  chrome.storage.local.get(['prices'], (result) => {
    res({
      blocknative: (result && result.prices && result.prices.blocknative) || [null, null, null],
      etherscan: (result && result.prices && result.prices.etherscan) || [null, null, null],
      egs: (result && result.prices && result.prices.egs) || [null, null, null],
      blocknative1559: (result && result.prices && result.prices.blocknative1559) || [null, null, null],
    });
  });
});

const getStoredBadgeSource = () => new Promise((res) => {
  chrome.storage.local.get(['badgeSource'], (result) => {
    const defaultBadgeSource = 'blocknative|1';
    res((result && result.badgeSource) || defaultBadgeSource);
  });
});

const formatPrice = (price) => (price === null ? '...' : Math.trunc(price));
const formatHtml = (prices) => (prices === null ? '...' : `${prices[0]}<br />${prices[1]}`);

const updateDOMForProvider = (provider, prices) => {
  if (provider === 'blocknative1559') {
    document.querySelector(`#${provider} .fast`).innerHTML = formatHtml(prices[provider][0]);
    document.querySelector(`#${provider} .normal`).innerHTML = formatHtml(prices[provider][1]);
    document.querySelector(`#${provider} .slow`).innerHTML = formatHtml(prices[provider][2]);
  } else {
    document.querySelector(`#${provider} .fast`).textContent = formatPrice(prices[provider][0]);
    document.querySelector(`#${provider} .normal`).textContent = formatPrice(prices[provider][1]);
    document.querySelector(`#${provider} .slow`).textContent = formatPrice(prices[provider][2]);
  }

  const hasData = (
    prices[provider][0] !== null &&
    prices[provider][1] !== null &&
    prices[provider][2] !== null
  );

  document.querySelector(`#${provider} .timestamp`)
    .setAttribute('data-timestamp', hasData ? prices[provider][3] : '');
};

const updateDOM = (prices) => {
  updateDOMForProvider('blocknative', prices);
  updateDOMForProvider('etherscan', prices);
  updateDOMForProvider('egs', prices);
  updateDOMForProvider('blocknative1559', prices);

  if (refreshButtonEl.getAttribute('data-content-loaded') !== 'true') {
    refreshButtonEl.setAttribute('data-content-loaded', 'true');
  }
};

const updateDOMForBadgeSource = (badgeSource) => {
  document.querySelectorAll(`table td[data-source]:not([data-source="${badgeSource}"])`)
    .forEach((el) => {
      el.removeAttribute('data-selected');
      el.setAttribute('title', 'Display this value in the badge');
    });

  const preferredEl = document.querySelector(`table td[data-source="${badgeSource}"]`);
  preferredEl.setAttribute('data-selected', 'true');
  preferredEl.removeAttribute('title');
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

  if (areaName === 'local' && changes.badgeSource) {
    const newBadgeSource = changes.badgeSource.newValue;
    updateDOMForBadgeSource(newBadgeSource);
  }
});

const timestampEls = document.querySelectorAll('.timestamp');
const updateTimestampDisplay = () => timestampEls.forEach((el) => updateTimestampDisplayDOM(el));
setInterval(updateTimestampDisplay, 500);

Promise.all([
  getStoredPrices(),
  getStoredBadgeSource(),
])
  .then(([prices, badgeSource]) => {
    updateDOM(prices);
    updateDOMForBadgeSource(badgeSource);
  })
  .then(() => updateTimestampDisplay());

refreshButtonEl.addEventListener('click', () => {
  if (refreshButtonEl.getAttribute('data-content-loaded') === 'true') {
    refreshButtonEl.setAttribute('data-content-loaded', 'false');
    chrome.runtime.sendMessage({ action: 'refresh-data' });
  }
});

document.querySelector('table').addEventListener('click', ({ target }) => {
  const badgeSource = target.getAttribute('data-source');

  if (badgeSource) {
    chrome.runtime.sendMessage({ action: 'update-badge-source', badgeSource });
  }
});

window.addEventListener('load', function () {
  const selector = Math.random() < .5 ? ".link-wrap" : ".link-wrap-filled";
  document.querySelector(selector).classList.add('hide');
});
