import fs from 'fs'
import fetch from 'node-fetch';
import osmtogeojson from 'osmtogeojson';


async function ceste() {


const cesteAPI = await fetch('https://overpass-api.de/api/interpreter?data=%2F*%0AThis%20has%20been%20generated%20by%20the%20overpass-turbo%20wizard.%0AThe%20original%20search%20was%3A%0A%E2%80%9Chighway%3D*%20in%20split%E2%80%9D%0A*%2F%0A%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0A%2F%2F%20fetch%20area%20%E2%80%9Csplit%E2%80%9D%20to%20search%20in%0Aarea%28id%3A3611153757%29-%3E.searchArea%3B%0A%2F%2F%20gather%20results%0A%28%0A%20%20%2F%2F%20query%20part%20for%3A%20%E2%80%9Chighway%3D*%E2%80%9D%0A%20%20node%5B%22highway%22%5D%28area.searchArea%29%3B%0A%20%20way%5B%22highway%22%5D%28area.searchArea%29%3B%0A%20%20relation%5B%22highway%22%5D%28area.searchArea%29%3B%0A%29%3B%0A%2F%2F%20print%20results%0Aout%20body%3B%0A%3E%3B%0Aout%20skel%20qt%3B');
const ceste = await cesteAPI.json();
const cestegeojson = osmtogeojson(ceste);

  const cesteJSON = JSON.stringify(cestegeojson);
  fs.writeFileSync('./geojson/cesteGeoJSON.geojson', cesteJSON, (err) => {
    if (err) {
        throw err;
    }
});

};

ceste()

