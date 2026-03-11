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
        this.empleadosAsignados = []; // IDs de ciudadanos que trabajan aquí
        this.reservaActual = stats.reservaInicial || 0; // Cantidad acumulada de recurso
        this.capacidadAlmacenamiento = stats.almacenamiento || 1000; // Máximo de recurso almacenado
    }

    /**
     * Asigna un ciudadano como empleado si hay puestos disponibles
     */
    asignarEmpleado(idCiudadano) {
        if (this.ocupacionActual < this.capacidadMaxima) {
            this.empleadosAsignados.push(idCiudadano);
            this.ocupacionActual++;
            return true;
        }
        return false;
    }

    /**
     * Desasigna un empleado
     */
    desasignarEmpleado(idCiudadano) {
        const index = this.empleadosAsignados.indexOf(idCiudadano);
        if (index > -1) {
            this.empleadosAsignados.splice(index, 1);
            this.ocupacionActual--;
            return true;
        }
        return false;
    }

    /**
     * Produce y añade recurso a la reserva según ocupación y producción
     */
    producirRecurso() {
        const producidoEsteTurno = this.produccionRecurso * this.ocupacionActual;
        this.reservaActual += producidoEsteTurno;
        
        // No puede exceder la capacidad de almacenamiento
        if (this.reservaActual > this.capacidadAlmacenamiento) {
            this.reservaActual = this.capacidadAlmacenamiento;
        }
        
        return producidoEsteTurno;
    }

    /**
     * Consume y descuenta recurso de la reserva
     */
    consumirRecurso(cantidad) {
        if (this.reservaActual >= cantidad) {
            this.reservaActual -= cantidad;
            return true;
        }
        return false;
    }

    /**
     * Calcula el porcentaje de capacidad utilizado
     */
    calcularPorcentajeCapacidad() {
        return (this.reservaActual / this.capacidadAlmacenamiento) * 100;
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
            empleadosAsignados: this.empleadosAsignados,
            estaOperativo: this.estaOperativo,
            reservaActual: this.reservaActual,
            capacidadAlmacenamiento: this.capacidadAlmacenamiento,
            porcentajeCapacidad: this.calcularPorcentajeCapacidad()
        };
    }
}
