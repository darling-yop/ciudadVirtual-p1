/**
 * Ciudad.js
 * Entidad principal que representa el espacio urbano gestionado por el alcalde.
 */
class Ciudad {
    constructor(nombre, region, ancho, alto) {
        // Atributos básicos de identificación [1]
        this.nombre = nombre || "Nueva Ciudad";
        this.nombreAlcalde = ""; // Nombre del jugador [4]
        
        // Región geográfica basada en ciudades reales de Colombia [1]
        this.region = region || {
            nombre: "Bogotá",
            coordenadas: { lat: 4.6097, lon: -74.0817 }
        };

        // Configuración del territorio (Rango: 15x15 a 30x30) [1, 4]
     this.ancho = Math.min(Math.max(ancho || 15, 15), 30);
        this.alto = Math.min(Math.max(alto || 15, 15), 30);
        
        // Estado de la partida [1] 
        this.turnoActual = 0;
        this.puntuacionAcumulada = 0;

        // Composición urbana [2]
        this.mapa = this.#inicializarMapa(); // Matriz/Grid bidimensional
        this.edificios = [];                 // Colección de instancias de Building
        this.vias = [];                      // Red de caminos/Roads
        this.poblacion = [];                 // Población de ciudadanos (instancias de Ciudadano)

        // Estado inicial de recursos [3, 5-7]
        this.recursos = {
            dinero: 50000,        // Inicial: $50,000 [5]
            electricidad: 0,      // Inicial: 0 (requiere plantas) [6]
            agua: 0,              // Inicial: 0 (requiere plantas) [6]
            comida: 0             // Inicial: 0 [7]
        };
    }

    /**
     * Crea una matriz vacía para representar el territorio inicial (convención 'g' = grass) [2, 8].
     */
    #inicializarMapa() {
        return Array.from({ length: this.alto }, () => Array(this.ancho).fill('g'));
    }
}
