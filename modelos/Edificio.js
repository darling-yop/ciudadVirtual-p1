/**
 * Edificio.js
 * Clase de modelo que representa cualquier estructura construible en la ciudad.
 */
class Edificio {
    constructor(id, tipo, x, y, stats) {
        // Identificación y ubicación
        this.id = id;
        this.tipo = tipo; // Convenciones: R1, R2, C1, C2, I1, I2, S1, S2, S3, U1, U2, P1 [1]
        this.x = Number(x);
        this.y = Number(y);

        // Atributos económicos [1, 5]
        this.costoConstruccion = stats.costo || 0;
        this.ingresoPorTurno = stats.ingreso || 0; // Para comerciales y fábricas [2, 3]

        // Atributos de recursos [1, 6, 7]
        this.consumoElectricidad = stats.consumoElectricidad || 0;
        this.consumoAgua = stats.consumoAgua || 0;
        this.produccionRecurso = stats.produccion || 0; // Energía, Agua o Comida [3, 4]

        // Capacidades [1-3]
        this.capacidadMaxima = stats.capacidad || 0; // Ciudadanos o Empleos
        this.ocupacionActual = 0;

        // Atributos de servicios y parques [3, 4]
        this.radioInfluencia = stats.radio || 0; // Radio en celdas
        this.beneficioFelicidad = stats.beneficio || 0;

        // Estado operativo [2, 8, 9]
        this.estaOperativo = true; // Puede desactivarse si falta electricidad o agua
    }

    /**
     * Calcula el dinero recuperado al eliminar la estructura.
     * Según la regla, se recupera el 50% del costo original [10].
     */
    get reembolsoDemolicion() {
        return this.costoConstruccion * 0.5;
    }

    /**
     * Verifica si el edificio tiene ocupación completa [1, 11].
     */
    get estaLleno() {
        return this.ocupacionActual >= this.capacidadMaxima;
    }

    /**
     * Devuelve la producción fija asociada al edificio.
     * Esta función permite que los edificios de utilidades e industrias
     * sean consumidos de forma uniforme en la lógica de simulación.
     */
    producirRecurso() {
        return Number(this.produccionRecurso || 0);
    }
}

export { Edificio };

