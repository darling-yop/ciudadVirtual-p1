class Ciudad {
    constructor(nombre, nombreAlcalde, region, ancho, alto) {
        // Atributos obligatorios de identificación [4]
        this.nombre = nombre || "Nueva Ciudad";
        this.nombreAlcalde = nombreAlcalde || "";

        // Región geográfica basada en una ciudad real de Colombia [1]
        this.region = region || {
            nombre: "Bogotá",
            coordenadas: { lat: 4.6097, lon: -74.0817 }
        };

        // Validación y saneamiento de dimensiones del mapa (Rango: 15x15 a 30x30) [1, 2, 4]
        this.ancho = Math.min(Math.max(Number(ancho) || 15, 15), 30);
        this.alto = Math.min(Math.max(Number(alto) || 15, 15), 30);

        // Estado temporal y de rendimiento [1]
        this.turnoActual = 0;
        this.puntuacionAcumulada = 0;

        // Composición urbana según el modelo de dominio [2]
        this.mapa = this.#inicializarMapa(); // Matriz bidimensional (Grid)
        this.edificios = [];                 // Colección de estructuras construidas
        this.vias = [];                      // Red de infraestructura vial
        this.poblacion = [];                 // Colección de ciudadanos simulados

        // Balance inicial de recursos configurado por normativa del juego [5-8]
        this.recursos = {
            dinero: 50000,        // Capital inicial: $50,000
            electricidad: 0,      // Inicial: 0 (requiere plantas de utilidad)
            agua: 0,              // Inicial: 0 (requiere plantas de utilidad)
            comida: 0             // Inicial: 0 (requiere granjas)
        };
    }

    /**
     * Crea la matriz inicial del territorio.
     * Utiliza la convención textual 'g' para representar terreno vacío (grass) [2, 9].
     */
    #inicializarMapa() {
        return Array.from({ length: this.alto }, () =>
            Array(this.ancho).fill('g')
        );
    }
}
