import { Mapa } from './Mapa.js';
import { Alcalde } from './Alcalde.js';
import { SistemaTurnos } from './SistemaTurnos.js';

class Ciudad {
    constructor(nombre, nombreAlcalde, region, ancho, alto) {
        // Atributos obligatorios de identificación [4]
        this.nombre = nombre || "Nueva Ciudad";

        // Instancia del alcalde que gestiona la ciudad
        this.alcalde = new Alcalde(1, nombreAlcalde || "Alcalde Anónimo", this);

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
        this.mapa = new Mapa(this.ancho, this.alto); // Instancia de la clase Mapa con validación integrada
        this.edificios = [];                          // Colección de estructuras construidas
        this.vias = [];                               // Red de infraestructura vial
        this.poblacion = [];                          // Colección de ciudadanos simulados

        // Balance inicial de recursos configurado por normativa del juego [5-8]
        this.recursos = {
            dinero: 50000,        // Capital inicial: $50,000
            electricidad: 0,      // Inicial: 0 (requiere plantas de utilidad)
            agua: 0,              // Inicial: 0 (requiere plantas de utilidad)
            comida: 0             // Inicial: 0 (requiere granjas)
        };

        // Sistema de turnos para la evolución temporal de la ciudad
        this.sistemaTurnos = new SistemaTurnos(this);
    }
}