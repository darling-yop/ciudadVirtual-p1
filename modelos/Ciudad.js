
import { Mapa } from './Mapa.js';
import { Alcalde } from './Alcalde.js';

class Ciudad {
    constructor(nombre, nombreAlcalde, region, ancho, alto) {
        // --- 1. ATRIBUTOS DE IDENTIFICACIÓN (HU-001) ---
        // Validación obligatoria de máximo 50 caracteres [2]
        this.nombre = (nombre || "Nueva Ciudad").substring(0, 50);
        
        // El Alcalde representa al actor/jugador del sistema [3]
        this.alcalde = new Alcalde(nombreAlcalde ? nombreAlcalde.substring(0, 50) : "Alcalde");

        // --- 2. REGIÓN GEOGRÁFICA (Integración API Colombia) ---
        // Basada en ciudades reales de Colombia (latitud/longitud) [2, 3]
        this.region = region || {
            nombre: "Bogotá",
            coordenadas: { lat: 4.6097, lon: -74.0817 }
        };

        // --- 3. DIMENSIONES Y TERRITORIO (HU-001) ---
        // Validación estricta entre 15x15 y 30x30 [2, 3]
        this.ancho = Math.min(Math.max(Number(ancho) || 15, 15), 30);
        this.alto = Math.min(Math.max(Number(alto) || 15, 15), 30);
        
        // Instancia del Grid bidimensional [3]
        this.mapa = new Mapa(this.ancho, this.alto);

        // --- 4. ESTADO DE LA SIMULACIÓN ---
        this.turnoActual = 0; [3]
        this.puntuacionAcumulada = 0; [3]

        // --- 5. COMPOSICIÓN URBANA [3] ---
        this.edificios = []; // Colección de instancias de Building
        this.vias = [];      // Red de infraestructura (Roads)
        this.poblacion = []; // Colección de ciudadanos (Inicia en 0) [4]

        // --- 6. ESTADO DE RECURSOS INICIALES (HU-001) [4-7] ---
        this.recursos = {
            dinero: 50000,        // Inicial obligatorio: $50,000
            electricidad: 0,      // Unidades/turno (Configurable desde UI)
            agua: 0,              // Unidades/turno (Configurable desde UI)
            comida: 0             // Unidades acumulables (Configurable desde UI)
        };
    }

    /**
     * Permite la configuración dinámica de recursos desde la interfaz [6, 7].
     */
    configurarRecursoDesdeIU(tipo, valor) {
        if (this.recursos.hasOwnProperty(tipo)) {
            this.recursos[tipo] = Number(valor);
        }
    }

    /**
     * REGLA DE CONSTRUCCIÓN: Valida adyacencia y presupuesto [8].
     * @param {number} costo - Costo del edificio o vía.
     * @param {number} x, y - Coordenadas de construcción.
     */
    puedeConstruir(x, y, costo) {
        if (this.recursos.dinero < costo) return false; [8]
        
        const vecinos = this.mapa.obtenerVecinos(x, y);
        // Regla: Los edificios requieren una vía ('r') adyacente [5, 8, 9].
        const tieneViaAdyacente = vecinos.some(([vx, vy]) => this.mapa.obtenerCelda(vx, vy) === 'r');
        
        return tieneViaAdyacente && this.mapa.estaDisponible(x, y); [8, 9]
    }

    /**
     * SISTEMA DE TURNOS: Ciclo automático cada 10 segundos [10, 11].
     */
    procesarTurno() {
        this.turnoActual++;

        // 1. Verificar condiciones críticas de derrota [6, 7]
        if (this.recursos.electricidad < 0 || this.recursos.agua < 0 || this.recursos.dinero < 0) {
            this.finalizarJuego("Recursos negativos detectados");
            return;
        }

        // 2. Gestión de Población (HU-013) [12-14]
        this.#gestionarCrecimientoPoblacional();

        // 3. Actualización de Puntuación (HU-018) [15, 16]
        this.#actualizarPuntuacion();
    }

    /**
     * Crecimiento automático: 1-3 ciudadanos si felicidad > 60 y hay espacio [12, 14].
     */
    #gestionarCrecimientoPoblacional() {
        const felicidadPromedio = this.obtenerFelicidadPromedio();
        const capacidadVivienda = this.edificios
            .filter(e => e.tipo.startsWith('R'))
            .reduce((acc, e) => acc + (e.capacidadMaxima || 0), 0);

        if (felicidadPromedio > 60 && this.poblacion.length < capacidadVivienda) {
            const nuevos = Math.floor(Math.random() * 3) + 1; // Parametrizable [12]
            for (let i = 0; i < nuevos; i++) {
                this.poblacion.push({ id: Date.now() + i, felicidad: 50 });
            }
        }
    }

    /**
     * FÓRMULA DE SCORING: population*10 + happiness*5 + money/100... [15, 16]
     */
    #actualizarPuntuacion() {
        const felicidad = this.obtenerFelicidadPromedio();
        const numEdificios = this.edificios.length;
        
        let score = (this.poblacion.length * 10) + 
                    (felicidad * 5) + 
                    (this.recursos.dinero / 100) + 
                    (numEdificios * 50);

        // Aplicar penalizaciones por desempleo [17, 18]
        const desempleados = this.poblacion.filter(c => !c.tieneEmpleo).length;
        score -= (desempleados * 10);

        this.puntuacionAcumulada = score;
    }

    obtenerFelicidadPromedio() {
        if (this.poblacion.length === 0) return 0;
        return this.poblacion.reduce((a, b) => a + b.felicidad, 0) / this.poblacion.length; [12, 19]
    }

    finalizarJuego(motivo) {
        console.error(`GAME OVER: ${motivo}`);
        // Aquí se dispararía la redirección o el modal de derrota.
    }
}
