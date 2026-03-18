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
        this.turnIntervalId = null;
        this.autoSaveIntervalId = null;

        CityManager.instance = this;
    }

    static getInstance() {
        if (!CityManager.instance) {
            CityManager.instance = new CityManager();
        }
        return CityManager.instance;
    }

    init() {
        const saved = CityRepository.load();
        if (saved) {
            this.ciudad = Ciudad.fromJSON(saved);
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
        }

        // Cargar estado desde backend si está disponible (no bloquea el render inicial)
        this._loadFromBackend();

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
        const state = this.ciudad.toJSON();
        CityRepository.save(state);
        // Intentar también persistir en backend (si está disponible)
        GameRepository.save(state).catch(() => {
            // Silenciar errores (el backend puede no estar disponible en local)
        });
    }

    exportToFile() {
        if (!this.ciudad) return;
        CityRepository.exportToFile(this.ciudad.toJSON());
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
        if (!this.ciudad) return { exito: false, mensaje: 'Ciudad no iniciada.' };
        const resultado = this.ciudad.alcalde.construirEdificio(tipo, x, y);
        if (resultado && resultado.exito) {
            this.save();
            return resultado;
        }
        return resultado || { exito: false, mensaje: 'No se pudo construir (verificar validaciones).' };
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
}

export { CityManager };

