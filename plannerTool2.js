const stationInput = document.querySelector('#station-input');
const dateInput = document.querySelector('#date');
const searchBtn = document.querySelector('#searchBtn');
const results = document.querySelector('#results');
const trainChainElement = document.querySelector('#trainChain');

let trainChain = []
let stations = {}
let all = {}

function displayTrainsFromStation(stationName, allTrains, date){

  displayTrainChain(stationName)

  Object.entries(allTrains).forEach(([station, trainsOfStation]) => {
    const stationLi = document.createElement("li")
    stationLi.classList.add("stationLi");

    const stationNameElement = document.createElement("p")
    stationNameElement.classList.add("stationName")
    stationNameElement.textContent = `-> ${station}`

    const trainsListElement = document.createElement("ul")
    trainsListElement.classList.add("trainsList")

    stationLi.appendChild(stationNameElement)
    stationLi.appendChild(trainsListElement)
    results.appendChild(stationLi);

    trainsOfStation.forEach(train => {
      const trainElement = document.createElement("li")
      trainElement.classList.add("train")
      trainElement.textContent = `${train.heure_depart} - arrivee ${train.heure_arrivee}`
      trainsListElement.appendChild(trainElement)

      trainElement.addEventListener("click", () => {
        trainChain.push(train)
        searchTrains(train.destination, date, train.heure_arrivee)
      })
    })

  })
}

function displayTrainChain(stationName){
  trainChainElement.innerHTML = ''
  trainChain.forEach(train => {
    const stationElement = document.createElement("li")
    stationElement.classList.add("stationInChain")
    stationElement.classList.add("elementInChain")
    stationElement.textContent = train.origine

    trainChainElement.appendChild(stationElement)

    const departureElement = document.createElement("li")
    departureElement.classList.add("departureInChain")
    departureElement.classList.add("elementInChain")
    departureElement.textContent = train.heure_depart

    trainChainElement.appendChild(departureElement)

    const separationElement = document.createElement("li")
    separationElement.classList.add("separationInChain")
    separationElement.classList.add("elementInChain")
    separationElement.textContent = "-"

    trainChainElement.appendChild(separationElement)

    const arrivalElement = document.createElement("li")
    arrivalElement.classList.add("arrivalInChain")
    arrivalElement.classList.add("elementInChain")
    arrivalElement.textContent = train.heure_arrivee

    trainChainElement.appendChild(arrivalElement)

    stationElement.addEventListener("click", async () => {
      const index = trainChain.indexOf(train)
      trainChain.splice(index)

      console.log(trainChain[index - 1])
      if (!trainChain[index - 1]){
        console.log(index)
        console.log(trainChain)
        console.log(trainChain[index - 1] ? trainChain[index - 1].heure_arrivee : "01:00")

      }

      const time = trainChain[index - 1] ? trainChain[index - 1].heure_arrivee : "01:00"
      console.log(time)
      await searchTrains(train.origine, train.date, time)
    })
  })
  const currentStationElement = document.createElement("li")
  currentStationElement.classList.add("stationInChain")
  currentStationElement.classList.add("elementInChain")
  currentStationElement.textContent = stationName
  trainChainElement.appendChild(currentStationElement)
}

async function searchTrains(gare, date, from="06:00") {

  // get data from user inputted station
  all = {}
  stations = {}
  results.innerHTML = '';

  console.log(`searching for trains from ${gare} on ${date}`);
  let t = await fetchAllTrains(gare, date)
  t = getTrainsFromTime(t, from)
  sortTrains(all, t)
  console.log(all)
  stations[gare] = all

  // display data
  displayTrainsFromStation(gare, all, date)

}

searchBtn.addEventListener('click', e => searchTrains(stationInput.value, dateInput.value));

