/**
 * Clase que representa un mapa de ciudad virtual con un sistema de grid.
 * 
 * El mapa utiliza un sistema de coordenadas donde (0,0) es la esquina superior izquierda.
 * Las celdas pueden contener diferentes tipos de elementos urbanos según los requisitos.
 */
class Mapa {

    /**
     * Definición explícita de tipos válidos permitidos en el mapa.
     * Incluye terrenos vacíos, vías y diferentes tipos de edificios.
     */
    static TIPOS_VALIDOS = {
        // Terreno vacío
        VACIO: 'g',
        
        // Vías de comunicación
        VIA: 'r',
        
        // Edificios residenciales
        RESIDENCIAL_1: 'R1',
        RESIDENCIAL_2: 'R2',
        
        // Edificios comerciales
        COMERCIAL_1: 'C1',
        COMERCIAL_2: 'C2',
        
        // Edificios industriales
        INDUSTRIAL_1: 'I1',
        INDUSTRIAL_2: 'I2',
        
        // Servicios públicos
        SERVICIO_1: 'S1',
        SERVICIO_2: 'S2',
        SERVICIO_3: 'S3',
        
        // Utilitarios
        UTILITARIO_1: 'U1',
        UTILITARIO_2: 'U2',
        
        // Parque
        PARQUE: 'P1'
    };

    /**
     * Valida si un tipo de celda es válido según los requisitos del sistema.
     * @param {string} tipo - El tipo de celda a validar
     * @returns {boolean} true si el tipo es válido, false en caso contrario
     */
    static esTipoValido(tipo) {
        return Object.values(this.TIPOS_VALIDOS).includes(tipo);
    }

    /**
     * Getter que retorna una copia de todos los tipos válidos disponibles.
     * @returns {Object} Objeto con todos los tipos válidos y sus códigos
     */
    static get tiposValidos() {
        return { ...this.TIPOS_VALIDOS };
    }

    constructor(ancho, alto) {

        this.ancho = Math.min(Math.max(Number(ancho) || 15, 15), 30);
        this.alto = Math.min(Math.max(Number(alto) || 15, 15), 30);

        this.grid = this.#inicializarGrid();
    }

    #inicializarGrid() {
        return Array.from({ length: this.alto }, () =>
            Array(this.ancho).fill(Mapa.TIPOS_VALIDOS.VACIO)
        );
    }

    esCoordenadaValida(x, y) {
        return x >= 0 && x < this.ancho && y >= 0 && y < this.alto;
    }

    obtenerCelda(x, y) {
        if (!this.esCoordenadaValida(x, y)) return null;
        return this.grid[y][x];
    }

    estaDisponible(x, y) {
        return this.obtenerCelda(x, y) === Mapa.TIPOS_VALIDOS.VACIO;
    }

    actualizarCelda(x, y, tipo) {

        if (!this.esCoordenadaValida(x, y)) return false;

        // Validar que el tipo sea uno de los permitidos
        if (!Mapa.esTipoValido(tipo)) return false;

        // Solo permitir colocar sobre terreno vacío, excepto para demoler (tipo 'g')
        if (tipo !== Mapa.TIPOS_VALIDOS.VACIO && !this.estaDisponible(x, y)) {
            return false;
        }

        this.grid[y][x] = tipo;
        return true;
    }

    demoler(x, y) {

        if (!this.esCoordenadaValida(x, y)) return false;

        this.grid[y][x] = Mapa.TIPOS_VALIDOS.VACIO;
        return true;
    }

    obtenerVecinos(x, y) {

        const vecinos = [
            [x + 1, y],
            [x - 1, y],
            [x, y + 1],
            [x, y - 1]
        ];

        return vecinos.filter(([vx, vy]) =>
            this.esCoordenadaValida(vx, vy)
        );
    }

    /**
     * Construye un edificio en el mapa actualizando la celda correspondiente.
     * Valida que la coordenada sea válida, esté disponible y el tipo sea válido.
     * @param {string} tipo - Tipo de edificio a construir (debe ser valor válido de TIPOS_VALIDOS)
     * @param {number} x - Coordenada X donde construir
     * @param {number} y - Coordenada Y donde construir
     * @returns {boolean} true si la construcción fue exitosa, false en caso contrario
     */
    construirEdificio(tipo, x, y) {
        // Validar coordenadas
        if (!this.esCoordenadaValida(x, y)) {
            console.log(`Coordenadas (${x}, ${y}) fuera de los límites del mapa.`);
            return false;
        }

        // Validar que el tipo de edificio sea válido
        if (!Mapa.esTipoValido(tipo)) {
            console.log(`Tipo de edificio '${tipo}' no es válido.`);
            return false;
        }

        // Validar que la celda esté disponible (terreno vacío)
        if (!this.estaDisponible(x, y)) {
            console.log(`La celda (${x}, ${y}) no está disponible. Contiene: ${this.obtenerCelda(x, y)}`);
            return false;
        }

        // Actualizar la celda con el nuevo tipo de edificio
        return this.actualizarCelda(x, y, tipo);
    }

    /**
     * Demuele un edificio en el mapa en las coordenadas especificadas.
     * Limpia la celda y la convierte nuevamente en terreno vacío.
     * @param {number} x - Coordenada X del edificio a demoler
     * @param {number} y - Coordenada Y del edificio a demoler
     * @returns {Object} Objeto con información de la demolición: { exitoso: boolean, tipoDemolido: string }
     */
    demolerEdificio(x, y) {
        // Validar coordenadas
        if (!this.esCoordenadaValida(x, y)) {
            return { exitoso: false, tipoDemolido: null, motivo: 'Coordenadas fuera de límites' };
        }

        // Obtener el tipo actual de la celda
        const tipoDemolido = this.obtenerCelda(x, y);

        // No se puede demoler terreno vacío
        if (tipoDemolido === Mapa.TIPOS_VALIDOS.VACIO) {
            return { exitoso: false, tipoDemolido: null, motivo: 'No hay edificio para demoler en esta ubicación' };
        }

        // Ejecutar la demolición
        const exitoso = this.demoler(x, y);

        return {
            exitoso: exitoso,
            tipoDemolido: tipoDemolido,
            coordenadas: { x, y }
        };
    }

    /**
     * Obtiene todas las posiciones disponibles en el mapa capaces de recibir construcción.
     * Útil para búsqueda de ubicaciones o validaciones.
     * @returns {Array} Array de objetos con coordenadas {x, y} disponibles
     */
    obtenerPosicionesDisponibles() {
        const posiciones = [];
        
        for (let y = 0; y < this.alto; y++) {
            for (let x = 0; x < this.ancho; x++) {
                if (this.estaDisponible(x, y)) {
                    posiciones.push({ x, y });
                }
            }
        }

        return posiciones;
    }

    /**
     * Cuenta la cantidad de edificios de un tipo específico en el mapa.
     * @param {string} tipo - Tipo de edificio a contar
     * @returns {number} Cantidad de edificios encontrados
     */
    contarEdificiosPorTipo(tipo) {
        if (!Mapa.esTipoValido(tipo)) return 0;

        let cantidad = 0;
        for (let y = 0; y < this.alto; y++) {
            for (let x = 0; x < this.ancho; x++) {
                if (this.grid[y][x] === tipo) {
                    cantidad++;
                }
            }
        }

        return cantidad;
    }

    /**
     * Obtiene todas las coordenadas que contienen un tipo específico de edificio.
     * @param {string} tipo - Tipo de edificio a buscar
     * @returns {Array} Array de objetos con coordenadas {x, y}
     */
    obtenerPosicionesPorTipo(tipo) {
        if (!Mapa.esTipoValido(tipo)) return [];

        const posiciones = [];
        for (let y = 0; y < this.alto; y++) {
            for (let x = 0; x < this.ancho; x++) {
                if (this.grid[y][x] === tipo) {
                    posiciones.push({ x, y });
                }
            }
        }

        return posiciones;
    }

    /**
     * Obtiene un resumen estadístico del uso del mapa.
     * @returns {Object} Objeto con conteos de cada tipo de elemento del mapa
     */
    obtenerEstadisticasMapa() {
        const estadisticas = {};

        for (let y = 0; y < this.alto; y++) {
            for (let x = 0; x < this.ancho; x++) {
                const tipo = this.grid[y][x];
                estadisticas[tipo] = (estadisticas[tipo] || 0) + 1;
            }
        }

        return {
            dimensiones: { ancho: this.ancho, alto: this.alto },
            celdasTotales: this.ancho * this.alto,
            usos: estadisticas
        };
    }

    exportarMapa() {
        return JSON.parse(JSON.stringify(this.grid));
    }
}

// exportar clase para su uso externo
export { Mapa };
