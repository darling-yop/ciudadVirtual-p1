/**
 * Camino.js
 * Representa la infraestructura vial. 
 * Esencial para la conectividad de edificios y el sistema de rutas [1, 2].
 */
class Camino {
    constructor(id, x, y) {
        // Identificador único necesario para la serialización y persistencia (HU-020) [3, 4]
        this.id = id;
        
        // Coordenadas en el mapa [5]
        this.x = Number(x);
        this.y = Number(y);

        // Convención textual 'r' (road) para la carga de mapas (HU-002) [6, 7]
        this.tipo = 'r';

        // Restricción presupuestaria: Costo fijo por celda [1, 2]
        this.costoConstruccion = 100;

        // Regla de Recursos: Las vías no consumen electricidad ni agua [1]
        this.consumoElectricidad = 0;
        this.consumoAgua = 0;

        // Propiedad fundamental para el Routing System (HU-012) [8, 9]
        this.esTransitable = true;
    }

    /**
     * Regla de Demolición (HU-010):
     * Al demoler una vía, el alcalde recupera el 50% de la inversión [10].
     * @returns {number} Valor a reembolsar ($50).
     */
    obtenerReembolso() {
        return this.costoConstruccion * 0.5;
    }

    /**
     * Proporciona el valor de peso para la matriz de transitabilidad.
     * Según el Routing System, las vías equivalen a '1' (transitable) [8, 11].
     */
    obtenerPesoTransito() {
        return 1;
    }
}