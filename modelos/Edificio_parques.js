/**
 * Edificio_parques.js
 * Clase que representa parques y espacios recreativos (P1).
 * Estos edificios proporcionan recreación a todos los ciudadanos de la ciudad.
 */
import { Edificio } from './Edificio.js';

class EdificioParques extends Edificio {
    constructor(id, subtipo, x, y, stats) {
        // subtipo: P1
        super(id, subtipo, x, y, stats);
        
        // Atributos específicos de parques
        this.tipoRecreacion = stats.tipoRecreacion || "parque"; // Tipo de área de recreación
    }

    /**
     * Obtiene el estado actual del parque
     */
    obtenerEstado() {
        return {
            id: this.id,
            tipo: this.tipo,
            tipoRecreacion: this.tipoRecreacion,
            ubicacion: { x: this.x, y: this.y },
            estaOperativo: this.estaOperativo,
            beneficioFelicidad: this.beneficioFelicidad
        };
    }
}

export { EdificioParques };
