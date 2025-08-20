const API = 'https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/tgvmax/records';


function buildSearchUrl(gare, date, limit=100, offset=0) {
  const u = new URL(API);
  const esc = s => String(s).replace(/"/g, '\\"'); // échappe seulement les "
  const whereClause = `origine="${esc(gare)}"`;
  u.searchParams.set('select', 'date, train_no, origine, destination, heure_depart, heure_arrivee');
  u.searchParams.set('where', whereClause);
  u.searchParams.set('limit', String(limit));
  u.searchParams.set('offset', String(offset));
  u.searchParams.set('refine', `date:${date}`);
  u.searchParams.set('exclude', 'od_happy_card:NON');
  return u.toString();
}

async function fetchTrainAmount(gare, date) {
  const url = buildSearchUrl(gare, date, 0)
  const res = await fetch(url);
  if (!res.ok) {throw new Error(`HTTP ${res.status}`);}
  const json = await res.json();
  return json.total_count;
}

async function fetchAllTrains(gare, date){
  const pageSize = 100;
  let all = [];

  const total_count = await fetchTrainAmount(gare, date)
  const iterations = Math.ceil(total_count / pageSize);

  for (let i = 0; i < iterations; i++) {
    const url = buildSearchUrl(gare, date, pageSize, pageSize*i)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const rows = json.results || [];
    all = all.concat(rows);
  }
  all.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.heure_depart}`);
    const dateB = new Date(`${b.date}T${b.heure_depart}`);
    return dateA - dateB;
  });
  return all;
}


function getTrainsFromTime(trains, time="01:00") {
  // let trains = await fetchAllTrains(gare, date)
  return trains.filter(train => train.heure_depart >= time);
}


function sortTrains(all, trains) {
  // console.log(trains)
  trains.forEach(train => {
    if (!all[train.destination]) {
      all[train.destination] = [train];
    } else {
      all[train.destination].push(train);
    }
  })

}


(async () => {
  // const trains = await getTrainsFrom("BORDEAUX ST JEAN", "2025-08-19");
  // console.log(trains);
})();
