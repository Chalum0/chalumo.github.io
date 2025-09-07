const API = 'https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/tgvmax/records';


function buildApiUrl(origin, destination, date) {
  const u = new URL(API);
  const esc = s => String(s).replace(/"/g, '\\"');
  const whereClause = `origine="${esc(origin)}" and destination="${esc(destination)}"`;
  u.searchParams.set('where', whereClause);
  u.searchParams.set('limit', String(100));
  u.searchParams.set('offset', String(0));
  u.searchParams.set('refine', `date:${date}`);
  u.searchParams.set('exclude', 'od_happy_card:NON');
  return u.toString();
}


async function fetchTrainData(departure, destination, date) {
  try {
    const res = await fetch(buildApiUrl(departure, destination, date));
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


function filterTrains(trains, time){
  let out = [];
  trains.forEach(allTrains => {
    if (allTrains && Array.isArray(allTrains.results)) {
      for (const train of allTrains.results) {
        if (train && typeof train.heure_depart === "string" && train.heure_depart > time) {
          out.push(train);
        }
      }
    }
  })
  return out;
}


async function fetchAllTrainData(origin, date, time="00:00") {
  console.log(origin);
  console.log(allStations[origin])
  let allDestinations = Object.keys(allStations[origin]["destination"]);
  console.log(allDestinations);

  let promises = []

  allDestinations.forEach(destination => {
    promises.push(fetchTrainData(origin, destination, date, time));
  })

  const results = await Promise.all(promises)
  console.log(results);
  const sortedResults = filterTrains(results, time);
  console.log(sortedResults);
}