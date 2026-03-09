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

    exportarMapa() {
        return JSON.parse(JSON.stringify(this.grid));
    }
}

