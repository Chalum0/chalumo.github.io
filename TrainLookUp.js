const API = 'https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/tgvmax/records';

function buildApiUrl(departureOrArrival, latestOrEarliest, date) {
  const u = new URL(API);
  const esc = s => String(s).replace(/"/g, '\\"');
  u.searchParams.set('limit', String(100));
  u.searchParams.set('refine', `date:${date}`);
  u.searchParams.set('order_by', `${departureOrArrival} ${latestOrEarliest}`);
  return u.toString();
}

async function fetchTrainData(departureOrArrival, latestOrEarliest, date) {
  console.log(buildApiUrl(departureOrArrival, latestOrEarliest, date))
  try {
    const res = await fetch(buildApiUrl(departureOrArrival, latestOrEarliest, date));
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    return json;
  } catch (err) {
    console.error("Error fetching train data:", err);
    return null;
  }
}

const order   = document.getElementById("order");
const target  = document.getElementById("target");
const date    = document.getElementById("date");
const output  = document.getElementById("output");

const today = new Date().toISOString().split("T")[0];
date.value = today;


async function updateOutput() {

  console.log(date.value)

  let departureOrArrival = target.value === "departure" ? "heure_depart" : "heure_arrivee";
  let latestOrEarliest = order.value === "earliest" ? "ASC" : "DESC";

  const trains = await fetchTrainData(departureOrArrival, latestOrEarliest, date.value);

  console.log(departureOrArrival, latestOrEarliest);

  console.log(trains);
  let content = ""
  trains.results.forEach((train) => {
    content += `<li class="Train"><div class="stationAndTime">${train.origine}</div><div class="stationName">${train.heure_depart}</div> -> <div class="stationAndTime">${train.destination}</div><div class="stationName">${train.heure_arrivee}</div></li>`
  })
  output.innerHTML = content
}


[order, target, date].forEach(el => {
  el.addEventListener("change", updateOutput);
});

updateOutput();
