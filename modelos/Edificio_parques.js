/**
 * Edificio_parques.js
 * Clase que representa parques y espacios recreativos (P1).
 * Estos edificios proporcionan recreación a los ciudadanos dentro de su radio de influencia.
 */
class EdificioParques extends Edificio {
    constructor(id, subtipo, x, y, stats) {
        // subtipo: P1
        super(id, subtipo, x, y, stats);
        
        // Atributos específicos de parques
        this.tipoRecreacion = stats.tipoRecreacion || "parque"; // Tipo de área de recreación
        this.ciudadanosVisitando = []; // IDs de ciudadanos usando el parque
        this.capacidadVisitantes = stats.capacidadVisitantes || 100; // Máximo simultáneo
        this.mantenimientoPorTurno = stats.mantenimiento || 0; // Costo operativo
    }

    /**
     * Registra un ciudadano como visitante si hay espacio
     */
    registrarVisitante(idCiudadano) {
        if (this.ciudadanosVisitando.length < this.capacidadVisitantes) {
            if (!this.ciudadanosVisitando.includes(idCiudadano)) {
                this.ciudadanosVisitando.push(idCiudadano);
                return true;
            }
        }
        return false;
    }

    /**
     * Elimina un ciudadano de los visitantes del parque
     */
    removerVisitante(idCiudadano) {
        const index = this.ciudadanosVisitando.indexOf(idCiudadano);
        if (index > -1) {
            this.ciudadanosVisitando.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Calcula el beneficio total de recreación según visitantes activos
     */
    calcularBeneficioRecreacion() {
        return this.beneficioFelicidad * this.ciudadanosVisitando.length;
    }

    /**
     * Obtiene el porcentaje de ocupación del parque
     */
    calcularPorcentajeOcupacion() {
        return (this.ciudadanosVisitando.length / this.capacidadVisitantes) * 100;
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
            radioInfluencia: this.radioInfluencia,
            ciudadanosVisitando: this.ciudadanosVisitando,
            capacidadVisitantes: this.capacidadVisitantes,
            porcentajeOcupacion: this.calcularPorcentajeOcupacion(),
            estaOperativo: this.estaOperativo,
            beneficioRecreacion: this.calcularBeneficioRecreacion(),
            mantenimientoPorTurno: this.mantenimientoPorTurno
        };
    }
}
