/**
 * Edificio_servicios.js
 * Clase que representa edificios de servicios (S1: Salud, S2: Seguridad, S3: Educación).
 * Estos edificios proporcionan servicios públicos a los ciudadanos dentro de su radio de influencia.
 */
class EdificioServicios extends Edificio {
    constructor(id, subtipo, x, y, stats) {
        // subtipo: S1, S2, S3
        super(id, subtipo, x, y, stats);
        
        // Atributos específicos de servicios
        this.tipoServicio = stats.servicio || ""; // "salud", "seguridad", "educación"
        this.empleadosAsignados = []; // IDs de ciudadanos que trabajan aquí
        this.ciudadanosAtendidos = []; // IDs de ciudadanos que usan el servicio
        this.eficaciaServicio = stats.eficacia || 1; // Factor de efectividad del servicio
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
     * Desasigna un empleado del servicio
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
     * Registra un ciudadano como beneficiario del servicio dentro del radio
     */
    registrarCiudadano(idCiudadano) {
        if (!this.ciudadanosAtendidos.includes(idCiudadano)) {
            this.ciudadanosAtendidos.push(idCiudadano);
            return true;
        }
        return false;
    }

    /**
     * Elimina un ciudadano de los beneficiarios del servicio
     */
    removerCiudadano(idCiudadano) {
        const index = this.ciudadanosAtendidos.indexOf(idCiudadano);
        if (index > -1) {
            this.ciudadanosAtendidos.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Calcula el beneficio total del servicio según empleados y ciudadanos atendidos
     */
    calcularBeneficio() {
        return this.beneficioFelicidad * this.ciudadanosAtendidos.length * this.eficaciaServicio;
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
            empleadosAsignados: this.empleadosAsignados,
            ciudadanosAtendidos: this.ciudadanosAtendidos,
            estaOperativo: this.estaOperativo,
            beneficioTotal: this.calcularBeneficio()
        };
    }
}
