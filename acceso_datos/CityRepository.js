/**
 * CityRepository.js
 * Patrón Repository para persistir el estado de la ciudad en LocalStorage.
 * Proporciona métodos para guardar, cargar, limpiar y exportar el estado.
 */

const STORAGE_KEY = 'ciudadVirtual_estado';
const HISTORY_KEY = 'ciudadVirtual_historial';
const SAVES_KEY = 'ciudadVirtual_partidas';
const ACTIVE_SAVE_KEY = 'ciudadVirtual_partida_activa';
const MAX_HISTORY = 10;

function leerJSON(key, fallback = null) {
    try {
        const json = localStorage.getItem(key);
        return json ? JSON.parse(json) : fallback;
    } catch (error) {
        console.error(`CityRepository.leerJSON(${key})`, error);
        return fallback;
    }
}

function escribirJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function generarCityId(ciudadObjeto = {}) {
    const nombreBase = (ciudadObjeto?.nombre || ciudadObjeto?.cityName || 'ciudad')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'ciudad';

    return `${nombreBase}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizarEstadoCiudad(ciudadObjeto = {}) {
    const cityId = ciudadObjeto.cityId || generarCityId(ciudadObjeto);
    return { ...ciudadObjeto, cityId };
}

function construirMetadata(estado, updatedAt) {
    return {
        id: estado.cityId,
        nombre: estado.nombre || estado.cityName || 'Ciudad sin nombre',
        alcalde: estado.alcalde || estado.mayor || 'Alcalde',
        turno: Number(estado.turnoActual ?? estado.turn ?? 0),
        puntuacion: Number(estado.puntuacionAcumulada ?? estado.score ?? 0),
        ancho: Number(estado.ancho ?? estado.gridSize?.width ?? estado.mapa?.dimensiones?.ancho ?? 20),
        alto: Number(estado.alto ?? estado.gridSize?.height ?? estado.mapa?.dimensiones?.alto ?? 20),
        updatedAt
    };
}

function leerPartidas() {
    const partidas = leerJSON(SAVES_KEY, []);
    return Array.isArray(partidas) ? partidas : [];
}

function escribirPartidas(partidas) {
    escribirJSON(SAVES_KEY, partidas);
}

function reflejarEstadoActivo(estado) {
    if (!estado) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }

    escribirJSON(STORAGE_KEY, estado);
}

function migrarGuardadoLegadoSiExiste() {
    const partidasActuales = leerPartidas();
    if (partidasActuales.length > 0) return partidasActuales;

    const legado = leerJSON(STORAGE_KEY, null);
    if (!legado) return [];

    const estado = normalizarEstadoCiudad(legado);
    const updatedAt = new Date().toISOString();
    const migrada = [{
        id: estado.cityId,
        updatedAt,
        meta: construirMetadata(estado, updatedAt),
        data: estado
    }];

    escribirPartidas(migrada);
    localStorage.setItem(ACTIVE_SAVE_KEY, estado.cityId);
    reflejarEstadoActivo(estado);
    return migrada;
}

function obtenerPartidas() {
    const partidas = leerPartidas();
    if (partidas.length > 0) return partidas;
    return migrarGuardadoLegadoSiExiste();
}

function crearRespaldo(ciudadObjeto) {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        cityName: ciudadObjeto?.nombre || ciudadObjeto?.cityName || 'Ciudad sin nombre',
        cityId: ciudadObjeto?.cityId || null,
        savedAt: new Date().toISOString(),
        data: ciudadObjeto
    };
}

function cargarHistorial() {
    try {
        const json = localStorage.getItem(HISTORY_KEY);
        if (!json) return [];
        const historial = JSON.parse(json);
        return Array.isArray(historial) ? historial : [];
    } catch (error) {
        console.error('CityRepository.cargarHistorial', error);
        return [];
    }
}

export const CityRepository = {
    save(ciudadObjeto, options = {}) {
        try {
            const { cityId = null, setActive = true } = options;
            const estado = normalizarEstadoCiudad({ ...ciudadObjeto, cityId: cityId || ciudadObjeto?.cityId });
            const updatedAt = new Date().toISOString();

            const partidas = obtenerPartidas().filter((partida) => partida.id !== estado.cityId);
            partidas.unshift({
                id: estado.cityId,
                updatedAt,
                meta: construirMetadata(estado, updatedAt),
                data: estado
            });

            escribirPartidas(partidas);

            if (setActive) {
                localStorage.setItem(ACTIVE_SAVE_KEY, estado.cityId);
            }

            reflejarEstadoActivo(estado);

            const historial = cargarHistorial();
            const respaldo = crearRespaldo(estado);
            const nuevoHistorial = [respaldo, ...historial].slice(0, MAX_HISTORY);
            escribirJSON(HISTORY_KEY, nuevoHistorial);

            return estado.cityId;
        } catch (error) {
            console.error('CityRepository.save', error);
            return null;
        }
    },

    load(cityId = null) {
        try {
            const partidas = obtenerPartidas();
            if (partidas.length === 0) return null;

            const activeId = cityId || localStorage.getItem(ACTIVE_SAVE_KEY) || partidas[0].id;
            const partida = partidas.find((item) => item.id === activeId) || partidas[0];
            if (!partida?.data) return null;

            localStorage.setItem(ACTIVE_SAVE_KEY, partida.id);
            reflejarEstadoActivo(partida.data);
            return JSON.parse(JSON.stringify(partida.data));
        } catch (error) {
            console.error('CityRepository.load', error);
            return null;
        }
    },

    clear() {
        localStorage.removeItem(SAVES_KEY);
        localStorage.removeItem(ACTIVE_SAVE_KEY);
        localStorage.removeItem(STORAGE_KEY);
    },

    hasSaves() {
        return obtenerPartidas().length > 0;
    },

    listSaves() {
        return obtenerPartidas()
            .map((partida) => ({
                ...(partida.meta || construirMetadata(partida.data || {}, partida.updatedAt || new Date().toISOString())),
                id: partida.id,
                updatedAt: partida.updatedAt || partida.meta?.updatedAt || new Date().toISOString(),
                isActive: partida.id === localStorage.getItem(ACTIVE_SAVE_KEY)
            }))
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },

    getActiveSaveId() {
        const partidas = obtenerPartidas();
        if (partidas.length === 0) return null;
        return localStorage.getItem(ACTIVE_SAVE_KEY) || partidas[0].id;
    },

    setActiveSave(cityId) {
        const partidas = obtenerPartidas();
        const partida = partidas.find((item) => item.id === cityId);
        if (!partida) return false;
        localStorage.setItem(ACTIVE_SAVE_KEY, cityId);
        reflejarEstadoActivo(partida.data);
        return true;
    },

    deleteSave(cityId) {
        const partidas = obtenerPartidas();
        const filtradas = partidas.filter((item) => item.id !== cityId);
        if (filtradas.length === partidas.length) {
            return this.listSaves();
        }

        escribirPartidas(filtradas);

        const activeId = localStorage.getItem(ACTIVE_SAVE_KEY);
        if (activeId === cityId) {
            if (filtradas[0]) {
                localStorage.setItem(ACTIVE_SAVE_KEY, filtradas[0].id);
                reflejarEstadoActivo(filtradas[0].data);
            } else {
                localStorage.removeItem(ACTIVE_SAVE_KEY);
                reflejarEstadoActivo(null);
            }
        }

        if (filtradas.length === 0) {
            localStorage.removeItem(SAVES_KEY);
        }

        return this.listSaves();
    },

    loadHistory() {
        return cargarHistorial();
    },

    exportToFile(ciudadObjeto, filename = 'ciudad_exportada.json') {
        try {
            const blob = new Blob([JSON.stringify(ciudadObjeto, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('CityRepository.exportToFile', error);
        }
    }
};
