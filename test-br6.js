async function test() {
  const exRes = await fetch('https://open.er-api.com/v6/latest/USD');
  const exData = await exRes.json();
  const usdToBrl = exData.rates.BRL;
  console.log('Exchange rate:', usdToBrl);
}
test();
