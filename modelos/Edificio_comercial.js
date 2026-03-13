/**
 * Edificio_comercial.js
 * Clase que representa edificios comerciales (C1, C2) que generan ingresos y empleos.
 */
import { Edificio } from './Edificio.js';

class EdificioComercial extends Edificio {
    constructor(id, subtipo, x, y, stats) {
        // subtipo: C1 o C2
        super(id, subtipo, x, y, stats);
        
        // Atributos específicos de comercios
        this.empleadosAsignados = []; // IDs de ciudadanos que trabajan aquí
        this.multiplicadorIngresos = stats.multiplicador || 1; // Factor de aumento de ingresos
        this.impuestosPorTurno = stats.impuestos || 0; // Impuestos generados
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
     * Desasigna un empleado del comercio
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
     * Calcula los ingresos totales (fijos según tipo)
     */
    calcularIngresos() {
        return this.ingresoPorTurno;
    }

    /**
     * Calcula los impuestos generados según ingresos
     */
    calcularImpuestos() {
        return this.impuestosPorTurno * this.ocupacionActual;
    }

    /**
     * Obtiene el estado actual del comercio
     */
    obtenerEstado() {
        return {
            id: this.id,
            tipo: this.tipo,
            ubicacion: { x: this.x, y: this.y },
            empleadosAsignados: this.empleadosAsignados,
            ocupacionActual: this.ocupacionActual,
            capacidadMaxima: this.capacidadMaxima,
            estaOperativo: this.estaOperativo,
            ingresosGenerados: this.calcularIngresos(),
            impuestosGenerados: this.calcularImpuestos()
        };
    }
}

export { EdificioComercial };
