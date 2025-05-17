// background.js

// Add your exchangerate.host API key here
const EXCHANGE_RATE_API_KEY = "ede958b59cdf352cd1e210b395a68618";

const MAJOR_CURRENCIES = ["USD", "EUR", "GBP", "SEK", "NOK", "CHF", "JPY", "CAD", "AUD"];
const CACHE_KEY = "dkk_rates_cache";

async function getCachedRates() {
  return new Promise((resolve) => {
    chrome.storage.local.get([CACHE_KEY], (result) => {
      resolve(result[CACHE_KEY] || null);
    });
  });
}

async function setCachedRates(rates) {
  const cache = {
    rates,
    date: new Date().toISOString().slice(0, 10)
  };
  return new Promise((resolve) => {
    chrome.storage.local.set({ [CACHE_KEY]: cache }, resolve);
  });
}

async function fetchDailyRates() {
  const symbols = ["DKK", ...MAJOR_CURRENCIES].join(",");
  const url = `https://api.frankfurter.app/latest?from=EUR&to=${symbols}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();
  if (!data.rates || !data.rates.DKK) throw new Error(`API error: ${JSON.stringify(data)}`);
  // Calculate 1 unit of each currency in DKK using EUR as base
  const dkkPerEur = data.rates.DKK;
  const dkkRates = {};
  for (const cur of MAJOR_CURRENCIES) {
    if (cur === "DKK") continue;
    const curPerEur = data.rates[cur];
    if (!curPerEur) continue;
    dkkRates[cur] = dkkPerEur / curPerEur;
  }
  await setCachedRates(dkkRates);
  return dkkRates;
}

async function getDkkRate(fromCurrency) {
  const today = new Date().toISOString().slice(0, 10);
  let cache = await getCachedRates();
  if (!cache || cache.date !== today) {
    cache = { rates: await fetchDailyRates(), date: today };
  }
  return cache.rates[fromCurrency];
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "convert-to-dkk",
    title: "Convert to Danish kroner (DKK)",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "convert-to-dkk" && info.selectionText) {
    const amountMatch = info.selectionText.match(/([\d,.]+)\s*([A-Za-z]{3})?/);
    if (!amountMatch) {
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: () => alert('No valid currency amount selected.')
      });
      return;
    }
    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    const fromCurrency = amountMatch[2] ? amountMatch[2].toUpperCase() : 'USD';
    try {
      let dkk;
      if (MAJOR_CURRENCIES.includes(fromCurrency)) {
        const rate = await getDkkRate(fromCurrency);
        if (!rate) throw new Error(`No cached rate for ${fromCurrency}`);
        dkk = amount * rate;
      } else {
        // fallback to API for non-major currencies
        const url = `https://api.exchangerate.host/convert?from=${fromCurrency}&to=DKK&amount=${amount}&access_key=${EXCHANGE_RATE_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (!data.result) throw new Error(`API error: ${JSON.stringify(data)}`);
        dkk = data.result;
      }
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'Currency Conversion',
        message: `${amount} ${fromCurrency} = ${dkk.toFixed(2)} DKK`
      });
    } catch (e) {
      chrome.scripting.executeScript({
        target: {tabId: tab.id},
        func: (msg) => alert('Conversion failed: ' + msg),
        args: [e.message]
      });
    }
  }
});
