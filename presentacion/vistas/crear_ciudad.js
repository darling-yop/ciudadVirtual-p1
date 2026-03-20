import { CityRepository } from '../../acceso_datos/CityRepository.js';
import { Ciudad } from '../../modelos/Ciudad.js';

const colombiaMunicipios = {
    'Cundinamarca': {
        'Bogotá': { lat: 4.711, lon: -74.072 },
        'Soacha': { lat: 4.579, lon: -74.212 }
    },
    'Antioquia': {
        'Medellín': { lat: 6.244, lon: -75.581 },
        'Envigado': { lat: 6.159, lon: -75.578 }
    },
    'Valle del Cauca': {
        'Cali': { lat: 3.451, lon: -76.531 },
        'Palmira': { lat: 3.539, lon: -76.303 }
    }
};

const el = {
    form: document.getElementById('crear-ciudad-form'),
    inputCiudad: document.getElementById('input-ciudad'),
    inputAlcalde: document.getElementById('input-alcalde'),
    inputRegion: document.getElementById('input-region'),
    regionColombia: document.getElementById('region-colombia'),
    regionCustom: document.getElementById('region-custom'),
    inputDepartamento: document.getElementById('input-departamento'),
    inputMunicipio: document.getElementById('input-municipio'),
    inputLat: document.getElementById('input-lat'),
    inputLon: document.getElementById('input-lon'),
    inputTamano: document.getElementById('input-tamano'),
    botonCargarMapa: document.getElementById('boton-cargar-mapa'),
    inputMapaArchivo: document.getElementById('input-mapa-archivo'),
    estadoMapa: document.getElementById('estado-mapa'),
    botonVolver: document.getElementById('boton-volver')
};

let mapaTextoCargado = null;

function setRegionVisibilidad() {
    const region = el.inputRegion.value;
    el.regionColombia.classList.toggle('hidden', region !== 'colombia');
    el.regionCustom.classList.toggle('hidden', region !== 'custom');
}

function populateMunicipios(depa) {
    el.inputMunicipio.innerHTML = '<option value="">Selecciona municipio</option>';
    if (!depa || !colombiaMunicipios[depa]) return;
    Object.keys(colombiaMunicipios[depa]).forEach(mun => {
        const option = document.createElement('option');
        option.value = mun;
        option.textContent = mun;
        el.inputMunicipio.appendChild(option);
    });
}

function getRegionData() {
    const region = el.inputRegion.value;

    if (region === 'buenosaires') {
        return { nombre: 'Buenos Aires', coordenadas: { lat: -34.6037, lon: -58.3816 } };
    }
    if (region === 'mexico') {
        return { nombre: 'Ciudad de México', coordenadas: { lat: 19.4326, lon: -99.1332 } };
    }
    if (region === 'madrid') {
        return { nombre: 'Madrid', coordenadas: { lat: 40.4168, lon: -3.7038 } };
    }
    if (region === 'colombia') {
        const depa = el.inputDepartamento.value;
        const mun = el.inputMunicipio.value;
        if (!depa || !mun) {
            alert('Selecciona departamento y municipio en Colombia');
            return null;
        }
        const coordenadas = colombiaMunicipios[depa]?.[mun];
        if (!coordenadas) {
            alert('Municipio no encontrado en coordenadas');
            return null;
        }
        return { nombre: `${mun}, ${depa}`, coordenadas };
    }
    if (region === 'custom') {
        const lat = parseFloat(el.inputLat.value);
        const lon = parseFloat(el.inputLon.value);
        if (Number.isNaN(lat) || Number.isNaN(lon)) {
            alert('Ingresa latitud y longitud válidas');
            return null;
        }
        return { nombre: 'Personalizada', coordenadas: { lat, lon } };
    }
    return null;
}

function guardarCiudad() {
    const nombre = el.inputCiudad.value.trim();
    const alcalde = el.inputAlcalde.value.trim();
    const tamano = Number(el.inputTamano.value);

    if (!nombre || !alcalde) {
        alert('Llena el nombre de la ciudad y el alcalde');
        return;
    }
    if (Number.isNaN(tamano) || tamano < 15 || tamano > 30) {
        alert('El tamaño del mapa debe ser entre 15 y 30');
        return;
    }

    const region = getRegionData();
    if (!region) return;

    const ciudad = new Ciudad(nombre, alcalde, region, tamano, tamano);

    if (mapaTextoCargado) {
        const resultado = ciudad.cargarMapaDesdeTexto(mapaTextoCargado);
        if (!resultado.exito) {
            alert(`Error al cargar mapa: ${resultado.mensaje}`);
            return;
        }
    }

    CityRepository.save(ciudad.toJSON());
    window.location.href = './index.html';
}

el.inputRegion.addEventListener('change', setRegionVisibilidad);
el.inputDepartamento.addEventListener('change', () => populateMunicipios(el.inputDepartamento.value));

el.botonCargarMapa.addEventListener('click', () => el.inputMapaArchivo.click());

el.inputMapaArchivo.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    mapaTextoCargado = await file.text();

    el.estadoMapa.textContent = `Mapa cargado: ${file.name}`;
    el.estadoMapa.classList.remove('error');
    el.inputMapaArchivo.value = '';
});

el.form.addEventListener('submit', (e) => {
    e.preventDefault();
    guardarCiudad();
});

el.botonVolver.addEventListener('click', () => {
    window.location.href = './index.html';
});

setRegionVisibilidad();
