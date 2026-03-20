import { Ciudad } from '../../modelos/Ciudad.js';
import { CityRepository } from '../../acceso_datos/CityRepository.js';

const form = document.getElementById('setup-form');
const nombreCiudadInput = document.getElementById('nombre-ciudad');
const nombreAlcaldeInput = document.getElementById('nombre-alcalde');
const regionSelect = document.getElementById('region');
const tamanoMapaInput = document.getElementById('tamano-mapa');
const errorMsg = document.getElementById('error-msg');

function mostrarError(mensaje) {
    errorMsg.textContent = mensaje;
}

function limpiarError() {
    errorMsg.textContent = '';
}

function validarCampos() {
    const nombreCiudad = nombreCiudadInput.value.trim();
    const nombreAlcalde = nombreAlcaldeInput.value.trim();
    const region = regionSelect.value;
    const tamano = Number(tamanoMapaInput.value);

    if (!nombreCiudad || !nombreAlcalde || !region) {
        mostrarError('Todos los campos son obligatorios.');
        return false;
    }

    if (nombreCiudad.length > 50 || nombreAlcalde.length > 50) {
        mostrarError('El nombre de ciudad y alcalde no puede exceder 50 caracteres.');
        return false;
    }

    if (isNaN(tamano) || tamano < 15 || tamano > 30) {
        mostrarError('El tamaño del mapa debe ser entre 15 y 30.');
        return false;
    }

    return true;
}

function obtenerRegionPorNombre(nombre) {
    const regiones = {
        'Bogotá': { nombre: 'Bogotá', coordenadas: { lat: 4.711, lon: -74.072 } },
        'Medellín': { nombre: 'Medellín', coordenadas: { lat: 6.244, lon: -75.581 } },
        'Cali': { nombre: 'Cali', coordenadas: { lat: 3.451, lon: -76.531 } }
    };
    return regiones[nombre] || null;
}

form.addEventListener('submit', (event) => {
    event.preventDefault();
    limpiarError();

    if (!validarCampos()) return;

    const nombreCiudad = nombreCiudadInput.value.trim();
    const nombreAlcalde = nombreAlcaldeInput.value.trim();
    const region = obtenerRegionPorNombre(regionSelect.value);
    const tamano = Number(tamanoMapaInput.value);

    if (!region) {
        mostrarError('Selecciona una región válida.');
        return;
    }

    const nuevaCiudad = new Ciudad(nombreCiudad, nombreAlcalde, region, tamano, tamano);
    nuevaCiudad.recursos = { dinero: 50000, electricidad: 0, agua: 0, comida: 0 };

    CityRepository.save(nuevaCiudad.toJSON());

    window.location.href = 'game.html';
});

// Pantalla de configuración inicial de ciudad completada para HU-001.
