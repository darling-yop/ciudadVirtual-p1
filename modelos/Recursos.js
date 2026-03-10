/**
 * Recursos.js
 * Clase de modelo que gestiona los balances económicos, energéticos y alimentarios.
 * Cumple con las restricciones de la Sección 4 de la documentación del juego.
 */
class Recursos {
    constructor() {
        // A. DINERO (Money)
        this.dinero = 50000; // Inicial: $50,000 [1]

        // B. ELECTRICIDAD (Electricity) - Unidades/Turno [2]
        this.electricidad = 0; // Inicial: 0 (Configurable en cualquier momento)
        this.produccionEnergia = 0;
        this.consumoEnergia = 0;

        // C. AGUA (Water) - Unidades/Turno [2]
        this.agua = 0; // Inicial: 0 (Configurable en cualquier momento)
        this.produccionAgua = 0;
        this.consumoAgua = 0;

        // D. ALIMENTOS (Food) - Unidades Acumulables [3]
        this.alimentos = 0; // Inicial: 0 (Configurable en cualquier momento)
        this.produccionComida = 0;
    }

    /**
     * Permite la configuración externa desde la interfaz (cajas de texto)
     * para Electricidad, Agua y Alimentos en cualquier momento [2, 3].
     */
    configurarRecurso(tipo, nuevoValor) {
        const valor = Number(nuevoValor);
        if (isNaN(valor)) return;

        switch (tipo) {
            case 'electricidad': this.electricidad = valor; break;
            case 'agua': this.agua = valor; break;
            case 'alimentos': this.alimentos = valor; break;
        }
    }

    /**
     * Calcula el balance neto de servicios (Producción - Consumo).
     * Nota: La electricidad es consumida por todos excepto parques [2].
     */
    obtenerBalanceNetoEnergia() {
        return this.electricidad + (this.produccionEnergia - this.consumoEnergia);
    }

    obtenerBalanceNetoAgua() {
        return this.agua + (this.produccionAgua - this.consumoAgua);
    }

    /**
     * REGLA CRÍTICA: Verifica si se cumplen las condiciones de Fin de Juego.
     * Si la energía o el agua son negativos, el juego termina [2, 3].
     * @returns {Object} { derrota: boolean, motivo: string }
     */
    verificarEstadoCritico() {
        if (this.obtenerBalanceNetoEnergia() < 0) {
            return { derrota: true, motivo: "Energía negativa" };
        }
        if (this.obtenerBalanceNetoAgua() < 0) {
            return { derrota: true, motivo: "Balance de agua negativo" };
        }
        return { derrota: false, motivo: "" };
    }

    /**
     * Actualiza el capital acumulado basado en ingresos y mantenimiento.
     * El dinero aumenta por edificios comerciales e industriales [2].
     */
    procesarFinanzas(ingresos, costosMantenimiento) {
        this.dinero += (ingresos - costosMantenimiento);
    }

    /**
     * Los alimentos son acumulables y generados por granjas [3].
     * Impacto: Aumentan la felicidad si son suficientes.
     */
    acumularAlimentos() {
        this.alimentos += this.produccionComida;
    }
}
