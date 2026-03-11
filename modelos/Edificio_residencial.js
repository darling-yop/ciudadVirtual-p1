/**
 * Edificio_residencial.js
 * Clase que representa edificios residenciales (R1, R2) donde viven los ciudadanos.
 */
class EdificioResidencial extends Edificio {
    constructor(id, subtipo, x, y, stats) {
        // subtipo: R1 o R2
        super(id, subtipo, x, y, stats);
        
        // Atributos específicos de viviendas
        this.ciudadanosAsignados = []; // IDs de ciudadanos que viven aquí
        this.mantenimientoPorTurno = stats.mantenimiento || 0; // Costo operativo
    }

    /**
     * Asigna un ciudadano a la vivienda si hay espacio disponible
     */
    asignarCiudadano(idCiudadano) {
        if (this.ocupacionActual < this.capacidadMaxima) {
            this.ciudadanosAsignados.push(idCiudadano);
            this.ocupacionActual++;
            return true;
        }
        return false;
    }

    /**
     * Desasigna un ciudadano de la vivienda
     */
    desasignarCiudadano(idCiudadano) {
        const index = this.ciudadanosAsignados.indexOf(idCiudadano);
        if (index > -1) {
            this.ciudadanosAsignados.splice(index, 1);
            this.ocupacionActual--;
            return true;
        }
        return false;
    }

    /**
     * Calcula el ingreso total del edificio residencial según ocupación
     */
    calcularIngresos() {
        return this.ingresoPorTurno * this.ocupacionActual;
    }

    /**
     * Obtiene el estado actual de la vivienda
     */
    obtenerEstado() {
        return {
            id: this.id,
            tipo: this.tipo,
            ubicacion: { x: this.x, y: this.y },
            ciudadanosAsignados: this.ciudadanosAsignados,
            ocupacionActual: this.ocupacionActual,
            capacidadMaxima: this.capacidadMaxima,
            estaOperativo: this.estaOperativo,
            ingresosGenerados: this.calcularIngresos()
        };
    }
}
