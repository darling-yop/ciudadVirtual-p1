/**
 * CityManager.js
 * Singleton que centraliza el estado global de la ciudad y el ciclo de turnos.
 */

import { CityRepository } from '../acceso_datos/CityRepository.js';
import { GameRepository } from '../acceso_datos/GameRepository.js';
import { Ciudad } from '../modelos/Ciudad.js';

class CityManager {
    static instance;

    constructor() {
        if (CityManager.instance) return CityManager.instance;

        this.ciudad = null;
        this.activeCityId = null;
        this.turnIntervalId = null;
        this.autoSaveIntervalId = null;

        // Para entornos sin backend (por ejemplo archivo local), mantener false.
        // Activa solo si tienes API REST con POST /api/game.
        this.backendSyncEnabled = false;

        CityManager.instance = this;
    }

    static getInstance() {
        if (!CityManager.instance) {
            CityManager.instance = new CityManager();
        }
        return CityManager.instance;
    }

    init(cityId = null) {
        const saved = CityRepository.load(cityId);
        if (saved) {
            this.ciudad = Ciudad.fromJSON(saved);
            this.activeCityId = this.ciudad.cityId;
        } else {
            this.ciudad = new Ciudad(
                'Ciudad Simulada',
                'Alcalde Demo',
                {
                    nombre: 'Buenos Aires',
                    coordenadas: { lat: -34.6037, lon: -58.3816 }
                },
                20,
                20
            );
            this.activeCityId = this.ciudad.cityId;
        }

        // Cargar estado desde backend si está disponible (no bloquea el render inicial)
        if (this.backendSyncEnabled) {
            this._loadFromBackend();
        }

        this.save();
        return this.ciudad;
    }

    async _loadFromBackend() {
        const backendState = await GameRepository.load();
        if (!backendState) return;

        try {
            this.ciudad = Ciudad.fromJSON(backendState);
            // Guardar localmente para sincronizar
            this.save();
            console.log('Estado cargado desde backend');
        } catch (error) {
            console.warn('No se pudo restaurar estado desde backend', error);
        }
    }

    save() {
        if (!this.ciudad) return;
        window.dispatchEvent(new CustomEvent('city-save-status', { detail: { status: 'saving' } }));
        const state = this.ciudad.toJSON();

        // Guardado local siempre
        const savedId = CityRepository.save(state, { cityId: this.ciudad.cityId, setActive: true });
        const guardadoLocalExitoso = Boolean(savedId);
        if (savedId) {
            this.activeCityId = savedId;
            this.ciudad.cityId = savedId;
        }

        // Guardado remoto opcional (no obligatorio en modo offline)
        // Descomentar la línea `this.backendSyncEnabled = true` en el constructor para habilitarlo.
        if (this.backendSyncEnabled) {
            GameRepository.save(state).catch((error) => {
                console.warn('GameRepository.save omitido:', error);
            });
        }

        window.dispatchEvent(new CustomEvent('city-save-status', {
            detail: { status: guardadoLocalExitoso ? 'ok' : 'error' }
        }));
    }

    exportToFile() {
        if (!this.ciudad) return;

        const estado = this.ciudad.toJSON();
        const fecha = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const fechaToken = `${fecha.getFullYear()}${pad(fecha.getMonth() + 1)}${pad(fecha.getDate())}_${pad(fecha.getHours())}${pad(fecha.getMinutes())}`;
        const nombreSeguro = (this.ciudad.nombre || 'ciudad')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');

        const payload = {
            cityName: estado.nombre,
            mayor: estado.alcalde,
            gridSize: { width: estado.ancho, height: estado.alto },
            coordinates: estado.region?.coordenadas || { lat: null, lon: null },
            turn: estado.turnoActual,
            score: estado.puntuacionAcumulada,
            map: estado.mapa,
            buildings: estado.edificios,
            roads: estado.vias,
            resources: estado.recursos,
            citizens: estado.poblacion,
            population: estado.poblacion.length,
            happiness: Math.round(this.ciudad.obtenerFelicidadPromedio?.() || 0)
        };

        const filename = `ciudad_${nombreSeguro || 'ciudad'}_${fechaToken}.json`;
        CityRepository.exportToFile(payload, filename);
        return filename;
    }

    procesarTurno() {
        if (!this.ciudad) return;
        this.ciudad.procesarTurno();
        this.save();
    }

    iniciarCicloTurnos(callback) {
        if (this.turnIntervalId) return;
        this.turnIntervalId = setInterval(() => {
            this.procesarTurno();
            if (typeof callback === 'function') callback(this.obtenerEstado());
        }, 10 * 1000);
    }

    detenerCicloTurnos() {
        if (!this.turnIntervalId) return;
        clearInterval(this.turnIntervalId);
        this.turnIntervalId = null;
    }

    iniciarAutoGuardado() {
        if (this.autoSaveIntervalId) return;
        this.autoSaveIntervalId = setInterval(() => {
            if (typeof document !== 'undefined' && document.hidden) {
                return;
            }
            this.save();
        }, 30 * 1000);
    }

    detenerAutoGuardado() {
        if (!this.autoSaveIntervalId) return;
        clearInterval(this.autoSaveIntervalId);
        this.autoSaveIntervalId = null;
    }

    obtenerEstado() {
        if (!this.ciudad) return null;
        return this.ciudad.obtenerEstadoGeneral();
    }

    construir(tipo, x, y) {
        if (!this.ciudad) {
            console.error('CityManager.construir: ciudad no iniciada', { tipo, x, y });
            return { exito: false, mensaje: 'Ciudad no iniciada.' };
        }

        if (x == null || y == null || !tipo) {
            console.error('CityManager.construir: parámetros inválidos', { tipo, x, y });
            return { exito: false, mensaje: 'Parámetros de construcción inválidos.' };
        }

        const resultado = this.ciudad.alcalde.construirEdificio(tipo, x, y);

        if (!resultado || !resultado.exito) {
            console.warn('CityManager.construir: fallo de construcción', { tipo, x, y, resultado });
            return resultado || { exito: false, mensaje: 'No se pudo construir (verificar validaciones).' };
        }

        console.log('CityManager.construir: construcción exitosa', { tipo, x, y });
        try {
            this.save();
        } catch (error) {
            console.error('CityManager.construir: construcción aplicada pero falló el guardado', error);
            return {
                ...resultado,
                mensaje: 'Construcción realizada, pero ocurrió un error al guardar el estado.'
            };
        }

        return resultado;
    }

    demoler(x, y) {
        if (!this.ciudad) return { exito: false, mensaje: 'Ciudad no iniciada.' };
        const tipo = this.ciudad.mapa.obtenerCelda(x, y);
        if (tipo === this.ciudad.mapa.constructor.TIPOS_VALIDOS.VACIO) {
            return { exito: false, mensaje: 'Celda vacía.' };
        }

        const resultado = this.ciudad.mapa.demolerEdificio(x, y);
        if (!resultado.exitoso) return { exito: false, mensaje: resultado.motivo };

        // Eliminar edificio del listado de la ciudad si existe
        const indice = this.ciudad.edificios.findIndex(e => e.x === x && e.y === y);
        if (indice > -1) this.ciudad.edificios.splice(indice, 1);

        this.save();
        return { exito: true, mensaje: 'Demolición realizada.' };
    }

    async planificarRuta(idEdificioOrigen, idEdificioDestino) {
        if (!this.ciudad || !this.ciudad.alcalde) {
            return { exito: false, error: 'Ciudad no iniciada.' };
        }

        return await this.ciudad.alcalde.planificarRuta(idEdificioOrigen, idEdificioDestino);
    }
}

export { CityManager };

