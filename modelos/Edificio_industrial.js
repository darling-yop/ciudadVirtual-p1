/**
 * Edificio_industrial.js
 * Clase que representa edificios industriales (I1, I2) que producen recursos y empleos.
 */
import { Edificio } from './Edificio.js';

class EdificioIndustrial extends Edificio {
    constructor(id, subtipo, x, y, stats) {
        // subtipo: I1 o I2
        super(id, subtipo, x, y, stats);
        
        // Atributos específicos de industrias
        this.empleadosAsignados = []; // IDs de ciudadanos trabajadores
        this.recursoProducido = stats.recurso || ""; // Tipo: comida, energía, etc.
        this.contaminacion = stats.contaminacion || 0; // Nivel de contaminación generada
        this.tasaProduccion = stats.tasaProduccion || 1; // Multiplicador de producción
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
     * Desasigna un empleado de la industria
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
     * Calcula la producción total de recursos (fija según tipo)
     */
    calcularProduccion() {
        return this.produccionRecurso;
    }

    /**
     * Calcula los ingresos para fábricas (I1)
     */
    calcularIngresos() {
        if (this.tipo === 'I1') {
            return this.produccionRecurso; // $800 para fábricas
        }
        return 0;
    }

    /**
     * Calcula contaminación efectiva de la industria.
     */
    calcularContaminacion() {
        if (!this.estaOperativo) return 0;
        return this.contaminacion;
    }

    /**
     * Obtiene el estado actual de la industria
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
            recursoProducido: this.recursoProducido,
            produccionTotal: this.calcularProduccion(),
            contaminacionGenerada: this.calcularContaminacion()
        };
    }
}

export { EdificioIndustrial };
