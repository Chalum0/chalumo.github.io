const API = 'https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/tgvmax/records';

async function collectStations(limitTotal = 1000){
  const pageSize = 100;
  let offset = 0;
  const stations = new Set();
  while(stations.size < limitTotal && offset < limitTotal){
    const u = new URL(API);
    u.searchParams.set('limit', String(pageSize));
    u.searchParams.set('offset', String(offset));
    try{
      const res = await fetch(u);
      const json = await res.json();
      const rows = json.results || [];
      for(const r of rows){
        if(r.origine) stations.add(r.origine);
      }
      if(rows.length < pageSize) break; // plus de données
    }catch(e){
      console.error('Erreur fetch:', e);
      break;
    }
    offset += pageSize;
  }
  return Array.from(stations).sort();
}

async function populateStationDatalist(){
  const status = document.querySelector('#status');
  const listEl = document.querySelector('#stations');
  try{
    status.textContent = 'Chargement des gares…';
    const gares = await collectStations(1000);
    listEl.innerHTML = '';
    for(const g of gares){
      const opt = document.createElement('option');
      opt.value = g;
      listEl.appendChild(opt);
    }
    status.innerHTML = `<span class="ok">${gares.length} gares disponibles</span> • suggestions actives.`;
  }catch(e){
    status.innerHTML = '<span class="err">Échec du chargement des gares</span>';
  }
}

// populateStationDatalist();

async function fetchAllResults(url){
  const pageSize = 100;
  let all = [];

  const res = await fetch(url);
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const rows = json.results || [];
  all = all.concat(rows);
  return all;
}
function buildSearchUrl(gare, date, limit=100, offset=0){
  const u = new URL(API);
  const whereClause = `origine="${gare}"`;
  u.searchParams.set('select','date, train_no, origine, destination, heure_depart, heure_arrivee');
  u.searchParams.set('where', whereClause);
  u.searchParams.set('limit', String(limit));
  u.searchParams.set('offset', String(offset));
  u.searchParams.set('refine', `date:${date}`);
  u.searchParams.set('exclude', 'od_happy_card:NON');
  return u.toString();
}
function buildReturnSearchUrl(gare, destination, date, limit=100, offset=0){
  const u = new URL(API);
  const esc = s => String(s).replace(/"/g, '\\"'); // échappe seulement les "
  const whereClause = `origine="${esc(gare)}" AND destination="${esc(destination)}"`;
  u.searchParams.set('select','date, train_no, origine, destination, heure_depart, heure_arrivee');
  u.searchParams.set('where', whereClause);
  u.searchParams.set('limit', String(limit));
  u.searchParams.set('offset', String(offset));
  u.searchParams.set('refine', `date:${date}`);
  u.searchParams.set('exclude', 'od_happy_card:NON');
  return u.toString();
}
function sortDataByDestination(data) {
  const sorted = {};
  data.forEach(train => {
    if (sorted[train.destination]) {
      sorted[train.destination].push(train)
    } else {
      sorted[train.destination] = [train]
    }
  })
  return sorted;
}

function displayTrains(sorted, resultElement) {
  Object.entries(sorted).forEach(([key, value]) => {
    const sectionLi = document.createElement('li')
    resultElement.appendChild(sectionLi)
    const sectionName = document.createElement('p')
    sectionName.innerHTML = key
    sectionLi.appendChild(sectionName)
    const sectionUl = document.createElement('ul')
    sectionLi.appendChild(sectionUl)

    value.forEach(train => {
      const t = document.createElement('li')
      t.textContent = `${train.train_no}: ${train.heure_depart} - arrivée ${train.heure_arrivee}`
      sectionUl.appendChild(t)
    })

  })
}

function alignTrips(outboundList, returnList) {
  if (!Array.isArray(outboundList) || !Array.isArray(returnList)) {
    throw new TypeError("Expected two arrays");
  }
  if (outboundList.length === 0 || returnList.length === 0) {
    return { outbound: [], returns: [] };
  }

  // Build a lexicographically comparable timestamp "YYYY-MM-DDTHH:MM"
  const key = (date, time) => `${date}T${time}`;

  // 1) earliest arrival from outbound
  const earliestArrivalKey = outboundList
    .map(o => key(o.date, o.heure_arrivee))
    .sort()[0];

  // Filter returns by that cutoff
  const keptReturns = returnList.filter(r => key(r.date, r.heure_depart) >= earliestArrivalKey);
  if (keptReturns.length === 0) return { outbound: [], returns: [] };

  // 2) latest departure among kept returns
  const latestReturnDepartKey = keptReturns
    .map(r => key(r.date, r.heure_depart))
    .sort()
    .pop();

  // Filter outbound by that cutoff
  const keptOutbound = outboundList.filter(o => key(o.date, o.heure_arrivee) <= latestReturnDepartKey);

  return { outbound: keptOutbound, returns: keptReturns };
}

const stationInput = document.querySelector('#station');
const dateInput = document.querySelector('#date');
const searchBtn = document.querySelector('#searchBtn');
const checkOption = document.querySelector('#checkOption');


searchBtn.addEventListener('click', async ()=>{
  const gare = stationInput.value.trim();
  const date = dateInput.value.trim();
  console.log('Recherche demandée pour:', {gare, date});
  // console.log(buildSearchUrl(gare, date))

  try {
    const data = await fetchAllResults(buildSearchUrl(gare, date, 100, 0));
    const results = document.querySelector('.results')
    results.innerHTML = '';

    console.log(data)
    data.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.heure_depart}`);
      const dateB = new Date(`${b.date}T${b.heure_depart}`);
      return dateA - dateB;
    });

    if (data.length){

      const sortedData = sortDataByDestination(data);
      let returnData = {}

    //   IF Back and forth:
      if (checkOption.checked){
        let returnTrains = {}
        let destinations = Object.keys(sortedData);

        for (const destination of destinations) {
          let returnUrl = buildReturnSearchUrl(destination, gare, date);
          const returnTrips = await fetchAllResults(returnUrl);

          if (!returnTrips.length){
            console.log(destination)
            delete sortedData[destination]
          } else {
            returnTrips.sort((a, b) => {
              const dateA = new Date(`${a.date}T${a.heure_depart}`);
              const dateB = new Date(`${b.date}T${b.heure_depart}`);
              return dateA - dateB;
            });
            const { outbound, returns } = alignTrips(sortedData[destination], returnTrips);

            if (!outbound.length || !returns.length){
              delete sortedData[destination]
            } else {
              sortedData[destination] = outbound;
              returnData[destination] = returns;
            }

          }

        }
      }

      Object.entries(sortedData).forEach(([key, value]) => {
        const sectionLi = document.createElement('li')
        sectionLi.classList.add('train-destination')
        results.appendChild(sectionLi)
        const sectionName = document.createElement('p')
        sectionName.innerHTML = ` -> ${key}`
        sectionLi.appendChild(sectionName)

        const selectionContainer = document.createElement('div')
        selectionContainer.classList.add('selection-container')
        selectionContainer.classList.add('hidden')
        const outboundListContainer = document.createElement('ul')
        outboundListContainer.classList.add('trains-container')
        const returnListContainer = document.createElement('ul')
        returnListContainer.classList.add('trains-container')

        selectionContainer.appendChild(outboundListContainer)
        selectionContainer.appendChild(returnListContainer)

        sectionLi.appendChild(selectionContainer)


        // const sectionUl = document.createElement('ul')
        // sectionLi.appendChild(sectionUl)

        value.forEach(train => {
          const t = document.createElement('li')
          t.textContent = `${train.train_no}: ${train.heure_depart} - arrivée ${train.heure_arrivee}`
          t.classList.add('train')
          outboundListContainer.appendChild(t)
        })
        returnData[key].forEach(train => {
          const t = document.createElement('li')
          t.textContent = `${train.train_no}: ${train.heure_depart} - arrivée ${train.heure_arrivee}`
          t.classList.add('train')
          returnListContainer.appendChild(t)
        })

        sectionLi.addEventListener('click', e => {
          if (selectionContainer.classList.contains('hidden')) {
            selectionContainer.classList.remove('hidden')
          } else {
            selectionContainer.classList.add('hidden')
          }
        })

      })

    }

  } catch (e) {
    console.error(e);
  }
});