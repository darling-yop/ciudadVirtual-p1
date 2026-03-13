/**
 * Edificio_utilidades.js
 * Clase que representa edificios de utilidades (U1: Electricidad, U2: Agua).
 * Estos edificios producen recursos esenciales para toda la ciudad.
 */
class EdificioUtilidades extends Edificio {
    constructor(id, subtipo, x, y, stats) {
        // subtipo: U1 o U2
        super(id, subtipo, x, y, stats);
        
        // Atributos específicos de utilidades
        this.tipoUtilidad = stats.utilidad || ""; // "electricidad" o "agua"
    }

    /**
     * Obtiene el estado actual de la utilidad
     */
    obtenerEstado() {
        return {
            id: this.id,
            tipo: this.tipo,
            tipoUtilidad: this.tipoUtilidad,
            ubicacion: { x: this.x, y: this.y },
            estaOperativo: this.estaOperativo,
            produccion: this.produccionRecurso
        };
    }
}
