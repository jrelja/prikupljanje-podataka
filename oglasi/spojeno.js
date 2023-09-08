import pocetakKuce from "./pocetakKuce.js";
import pocetakStanovi from "./pocetakStanovi.js";
import pocetakZemljista from "./pocetakZemljista.js";



async function spojeno(grad) {

const kuce = await pocetakKuce(grad);
const stanovi = await pocetakStanovi(grad);
const zemljista = await pocetakZemljista(grad);


const spojeni = kuce.concat(stanovi).concat(zemljista);
return spojeni
};

export default spojeno;