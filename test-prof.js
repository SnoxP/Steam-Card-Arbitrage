async function test() {
  const games = ['508900', '533300', '573000', '617670', '437580', '608800', '614040', '508440'];
  for (const id of games) {
    const res = await fetch(`http://localhost:3000/api/analyze/${id}`);
    const data = await res.json();
    console.log(data.gameName, 'Price:', data.gamePrice, 'Drop:', data.expectedDropValueNet, 'Profitable:', data.isProfitable);
  }
}
test();
