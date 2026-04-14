/**
 * RankingLocal.js
 * Clase que gestiona el sistema de ranking local de ciudades.
 * Almacena el TOP 10 de ciudades ordenadas por puntuación acumulada.
 * Persistencia en LocalStorage con clave 'ciudadVirtual_ranking'.
 */
class RankingLocal {
    constructor() {
        this.CLAVE_RANKING = 'ciudadVirtual_ranking';
        this.MAX_RANKING = 10;
    }

    /**
     * Guarda la puntuación de una ciudad en el ranking.
     * Agrega la ciudad, ordena por puntuación descendente y mantiene solo el TOP 10.
     * @param {Ciudad} ciudad - Instancia de la clase Ciudad
     */
    guardarPuntuacion(ciudad) {
        try {
            // Obtener ranking actual
            const ranking = this.obtenerRanking();

            // Crear entrada para la ciudad
            const entradaCiudad = {
                nombre: ciudad.nombre,
                cityId: ciudad.cityId,
                puntuacionAcumulada: ciudad.puntuacionAcumulada,
                alcaldeNombre: ciudad.alcalde.nombre,
                poblacion: ciudad.poblacion ? ciudad.poblacion.length : 0,
                felicidadPromedio: Math.round(ciudad.obtenerFelicidadPromedio ? ciudad.obtenerFelicidadPromedio() : 0),
                turnoActual: ciudad.turnoActual,
                fechaGuardado: new Date().toISOString()
            };

            // Buscar si la ciudad ya existe en el ranking
            const indiceExistente = ranking.findIndex(c => c.cityId === ciudad.cityId);

            if (indiceExistente !== -1) {
                // Actualizar entrada existente
                ranking[indiceExistente] = entradaCiudad;
            } else {
                // Agregar nueva entrada
                ranking.push(entradaCiudad);
            }

            // Ordenar por puntuación descendente
            ranking.sort((a, b) => b.puntuacionAcumulada - a.puntuacionAcumulada);

            // Mantener solo el TOP 10
            const top10 = ranking.slice(0, this.MAX_RANKING);

            // Guardar en LocalStorage
            localStorage.setItem(this.CLAVE_RANKING, JSON.stringify(top10));

            console.log(`Puntuación guardada para ciudad ${ciudad.nombre}. Posición actual: ${this.obtenerPosicionActual(ciudad)}`);

        } catch (error) {
            console.error('Error guardando puntuación en ranking:', error);
        }
    }

    /**
     * Obtiene el ranking completo ordenado por puntuación descendente.
     * @returns {Array} Lista de ciudades en el ranking
     */
    obtenerRanking() {
        try {
            const rankingGuardado = localStorage.getItem(this.CLAVE_RANKING);
            if (rankingGuardado) {
                return JSON.parse(rankingGuardado);
            }
        } catch (error) {
            console.error('Error obteniendo ranking:', error);
        }
        return [];
    }

    /**
     * Limpia completamente el ranking con confirmación.
     * @returns {boolean} true si se limpió, false si se canceló
     */
    limpiarRanking() {
        const confirmacion = confirm('¿Estás seguro de que quieres reiniciar el ranking? Esta acción no se puede deshacer.');
        if (confirmacion) {
            localStorage.removeItem(this.CLAVE_RANKING);
            console.log('Ranking reiniciado');
            return true;
        }
        return false;
    }

    /**
     * Obtiene la posición actual de una ciudad en el ranking.
     * @param {Ciudad} ciudad - Instancia de la clase Ciudad
     * @returns {number} Posición (1-based) o 0 si no está en el ranking
     */
    obtenerPosicionActual(ciudad) {
        const ranking = this.obtenerRanking();
        const posicion = ranking.findIndex(c => c.cityId === ciudad.cityId);
        return posicion !== -1 ? posicion + 1 : 0;
    }

    /**
     * Obtiene estadísticas del ranking.
     * @returns {Object} Estadísticas del ranking
     */
    obtenerEstadisticas() {
        const ranking = this.obtenerRanking();
        return {
            totalCiudades: ranking.length,
            maxRanking: this.MAX_RANKING,
            ultimaActualizacion: ranking.length > 0 ? ranking[0].fechaGuardado : null
        };
    }
}

export { RankingLocal };
