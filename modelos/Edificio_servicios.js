/**
 * Edificio_servicios.js
 * Clase que representa edificios de servicios (S1: Salud, S2: Seguridad, S3: Educación).
 * Estos edificios proporcionan servicios públicos a todos los ciudadanos de la ciudad.
 */
import { Edificio } from './Edificio.js';

class EdificioServicios extends Edificio {
    constructor(id, subtipo, x, y, stats) {
        // subtipo: S1, S2, S3
        super(id, subtipo, x, y, stats);
        
        // Atributos específicos de servicios
        this.tipoServicio = stats.servicio || ""; // "salud", "seguridad", "educación"
    }

    /**
     * Obtiene el estado actual del servicio
     */
    obtenerEstado() {
        return {
            id: this.id,
            tipo: this.tipo,
            tipoServicio: this.tipoServicio,
            ubicacion: { x: this.x, y: this.y },
            radioInfluencia: this.radioInfluencia,
            estaOperativo: this.estaOperativo,
            beneficioFelicidad: this.beneficioFelicidad
        };
    }
}

export { EdificioServicios };
