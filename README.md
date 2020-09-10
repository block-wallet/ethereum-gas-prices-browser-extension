<p align="center"><img src="https://github.com/philippe-git/ethereum-gas-prices-browser-extension/blob/master/preview.png?raw=true" width="400" /></p>

# Ethereum Gas Prices

Always up-to-date Ethereum gas prices from the 3 most popular data sources for Ethereum gas information: [GasNow](https://www.gasnow.org/), [Etherscan](https://etherscan.io/gastracker), and [EthGasStation](https://ethgasstation.info/). Right in your browser (available for [Chrome](https://chrome.google.com/webstore/detail/ethereum-gas-prices/njbclohenpagagafbmdipcdoogfpnfhp), [Brave](https://chrome.google.com/webstore/detail/ethereum-gas-prices/njbclohenpagagafbmdipcdoogfpnfhp), [Firefox](https://addons.mozilla.org/en-CA/firefox/addon/ethereum-gas-prices/)).

The badge displays the current gas price estimation for "normal" transaction speeds: not too slow, not too fast.

Clicking on the badge displays price estimations for different speed expectations ("slow", "normal", and "fast" transaction times). Each data provider has a different estimation according to their own calculation method. GasNow uses memory pool information to make gas price estimations, while Etherscan and EthGasStation use on-chain block data, which is more of a lagging indicator.

Data from all providers is automatically refreshed every minute, and can be refreshed manually too.

## Privacy

The extension respects your privacy: zero data tracking, zero permissions required.

## Links

- Chrome extension: [Download for Chrome/Brave](https://chrome.google.com/webstore/detail/ethereum-gas-prices/njbclohenpagagafbmdipcdoogfpnfhp)
- Firefox extension: [Download for Firefox](https://addons.mozilla.org/en-CA/firefox/addon/ethereum-gas-prices/)


## Acknowledgments

- The [very first extension of this kind](https://chrome.google.com/webstore/detail/ethereum-gas-price-extens/innfmlnnhfcebjcnfopadflecemoddnp) was created by [Niel de la Rouviere](https://twitter.com/nieldlr) in 2018. I've used it for two years, and in late 2020's period of Ethereum congestion, I realized that alongside EthGasStation's invaluable gas price estimations, I could use additional data sources such as GasNow and Etherscan to get a more precise picture of the state of gas prices when I wanted to place a transaction. It wasn't long before I had built the habit of manually checking three different things before placing transactions: Niel's extension, GasNow's website, and Etherscan's website. And after a few weeks of this, I grew a desire to streamline that process, and put together this extension in order to very easily check gas price estimations from all three of those valuable sources. Thank you Niel for the inspiration, and GasNow, Etherscan and EthGasStation for this data!
- The two icons used in this extension were made by [freepik](https://www.freepik.com/)
