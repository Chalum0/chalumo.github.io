const stationNames = Object.keys(allStations);

const error = document.querySelector('#error');
const input = document.querySelector('#station-input');

const datalist = document.createElement('datalist');
datalist.id = 'stations-list';

stationNames.forEach(name => {
  const option = document.createElement('option');
  option.value = name;
  datalist.appendChild(option);
});

document.body.appendChild(datalist);
input.setAttribute('list', 'stations-list');

function checkInputtedStation(station){
  if (stationNames.includes(station)) {
    error.textContent = "";
    return true;
  } else {
    error.textContent = "⚠️ Please enter a valid station from the list.";
    return false;
  }
}

input.addEventListener('change', e => checkInputtedStation(e.target.value));