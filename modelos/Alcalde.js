/**
 * Alcalde.js
 * Clase que representa al alcalde/jugador que gestiona la ciudad.
 * Responsable de las decisiones estratégicas y operaciones de la ciudad.
 */
import { crearEdificioDesdeTipo } from './EdificioFactory.js';

class Alcalde {
    constructor(id, nombre, ciudad) {
        // Identificación del alcalde/jugador
        this.id = id;
        this.nombre = nombre;

        // Referencia a la ciudad que gestiona
        this.ciudad = ciudad;

        // Atributos de progresión y estadísticas del jugador
        this.experiencia = 0;           // Experiencia acumulada por decisiones exitosas
        this.nivel = 1;                 // Nivel del alcalde (basado en experiencia)
        this.puntuacion = 0;            // Puntuación total del alcalde

        // Historial de acciones y decisiones tomadas
        this.decisiones = [];           // Array de decisiones tomadas
        this.accionesTurno = 0;         // Contador de acciones realizadas en el turno actual

        // Estadísticas de gestión
        this.edificiosConstruidos = 0;
        this.edificiosDemolidos = 0;
        this.recursosGestionados = 0;
    }

    /**
     * Construye un edificio en la ciudad en las coordenadas especificadas.
     * @param {string} tipo - Tipo de edificio a construir
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {boolean} - true si la construcción fue exitosa
     */
    construirEdificio(tipo, x, y) {
        // Validar que las coordenadas estén dentro del mapa
        if (x < 0 || x >= this.ciudad.ancho || y < 0 || y >= this.ciudad.alto) {
            console.log(`Coordenadas (${x}, ${y}) fuera del mapa de la ciudad.`);
            return { exito: false, mensaje: 'Coordenadas fuera del mapa.' };
        }

        // Validar reglas de construcción (costo, accesibilidad por vía, etc.)
        if (!this.ciudad.puedeConstruir(tipo, x, y)) {
            return { exito: false, mensaje: 'No se puede construir aquí (revisa costo, vía adyacente o celda ocupada).' };
        }

        // Intentar construir el edificio a través del mapa
        const construido = this.ciudad.mapa.construirEdificio(tipo, x, y);

        if (construido) {
            const costo = this.ciudad.obtenerCostoConstruccion(tipo);
            this.ciudad.recursos.dinero -= costo;

            // Registrar edificio en el estado de la ciudad
            const edificio = crearEdificioDesdeTipo(tipo, x, y);
            if (edificio) {
                this.ciudad.agregarEdificio(edificio);
            }

            this.edificiosConstruidos++;
            this.decisiones.push({
                tipo: 'construccion',
                edificio: tipo,
                coordenadas: { x, y },
                costo,
                turno: this.ciudad.turnoActual
            });
            this.accionesTurno++;
            return { exito: true };
        }

        return { exito: false, mensaje: 'No se pudo construir en la celda seleccionada.' };
    }

    /**
     * Demuele un edificio específico de la ciudad.
     * @param {number} idEdificio - ID del edificio a demoler
     * @returns {boolean} - true si la demolición fue exitosa
     */
    demolerEdificio(idEdificio) {
        const edificio = this.ciudad.edificios.find(e => e.id === idEdificio);

        if (!edificio) {
            console.log(`Edificio con ID ${idEdificio} no encontrado.`);
            return false;
        }

        // Intentar demoler el edificio a través del mapa
        const demolido = this.ciudad.mapa.demolerEdificio(idEdificio);

        if (demolido) {
            this.edificiosDemolidos++;
            this.decisiones.push({
                tipo: 'demolicion',
                edificio: edificio.tipo,
                id: idEdificio,
                turno: this.ciudad.turnoActual
            });
            this.accionesTurno++;
            return true;
        }

        return false  ;
    }

    /**
     * Gestiona la asignación de recursos en la ciudad.
     * @param {string} tipo - Tipo de recurso (dinero, electricidad, agua, comida)
     * @param {number} cantidad - Cantidad a asignar (positiva para agregar, negativa para quitar)
     * @returns {boolean} - true si la asignación fue exitosa
     */
    asignarRecursos(tipo, cantidad) {
        if (!this.ciudad.recursos.hasOwnProperty(tipo)) {
            console.log(`Tipo de recurso '${tipo}' no válido.`);
            return false;
        }

        const nuevoValor = this.ciudad.recursos[tipo] + cantidad;

        // Validar que no haya valores negativos para recursos críticos
        if ((tipo === 'electricidad' || tipo === 'agua' || tipo === 'comida') && nuevoValor < 0) {
            console.log(`No hay suficiente ${tipo} para asignar.`);
            return false;
        }

        if (tipo === 'dinero' && nuevoValor < 0) {
            console.log('Fondos insuficientes para esta asignación.');
            return false;
        }

        this.ciudad.recursos[tipo] = nuevoValor;
        this.recursosGestionados += Math.abs(cantidad);

        this.decisiones.push({
            tipo: 'asignacion_recursos',
            recurso: tipo,
            cantidad: cantidad,
            turno: this.ciudad.turnoActual
        });

        this.accionesTurno++;
        return true;
    }

    /**
     * Verifica el bienestar general de los ciudadanos de la ciudad.
     * @returns {Object} - Estadísticas de bienestar de la población
     */
    verificarBienestarCiudadanos() {
        const totalCiudadanos = this.ciudad.poblacion.length;
        if (totalCiudadanos === 0) {
            return { mensaje: 'No hay ciudadanos en la ciudad.' };
        }

        let ciudadanosFelices = 0;
        let ciudadanosConVivienda = 0;
        let ciudadanosConEmpleo = 0;

        this.ciudad.poblacion.forEach(ciudadano => {
            if (ciudadano.nivelFelicidad >= 70) ciudadanosFelices++;
            if (ciudadano.estadoVivienda) ciudadanosConVivienda++;
            if (ciudadano.estadoEmpleo) ciudadanosConEmpleo++;
        });

        return {
            totalCiudadanos,
            ciudadanosFelices,
            ciudadanosConVivienda,
            ciudadanosConEmpleo,
            porcentajeFelicidad: Math.round((ciudadanosFelices / totalCiudadanos) * 100),
            porcentajeVivienda: Math.round((ciudadanosConVivienda / totalCiudadanos) * 100),
            porcentajeEmpleo: Math.round((ciudadanosConEmpleo / totalCiudadanos) * 100)
        };
    }

    /**
     * Planifica una ruta de transporte entre dos edificios de la ciudad.
     * Implementa el Sistema de Rutas (Routing System) con validaciones completas.
     * 
     * @param {number} idEdificioOrigen - ID del edificio de origen
     * @param {number} idEdificioDestino - ID del edificio de destino
     * @returns {Object} - {exito: boolean, ruta: Array, error?: string}
     */
    planificarRuta(idEdificioOrigen, idEdificioDestino) {
        // ========================================
        // VALIDACIÓN 1: Verificar que los edificios existan
        // ========================================
        const edificioOrigen = this.ciudad.obtenerEdificio(idEdificioOrigen);
        if (!edificioOrigen) {
            return {
                exito: false,
                error: `Edificio de origen con ID ${idEdificioOrigen} no encontrado`
            };
        }

        const edificioDestino = this.ciudad.obtenerEdificio(idEdificioDestino);
        if (!edificioDestino) {
            return {
                exito: false,
                error: `Edificio de destino con ID ${idEdificioDestino} no encontrado`
            };
        }

        // ========================================
        // VALIDACIÓN 2: Verificar que no sean el mismo edificio
        // ========================================
        if (idEdificioOrigen === idEdificioDestino) {
            return {
                exito: false,
                error: 'El edificio de origen y destino no pueden ser el mismo'
            };
        }

        // ========================================
        // VALIDACIÓN 3: Verificar coordenadas válidas del mapa
        // ========================================
        if (!this.ciudad.mapa.esCoordenadaValida(edificioOrigen.x, edificioOrigen.y)) {
            return {
                exito: false,
                error: `Coordenadas inválidas del edificio origen (${edificioOrigen.x}, ${edificioOrigen.y})`
            };
        }

        if (!this.ciudad.mapa.esCoordenadaValida(edificioDestino.x, edificioDestino.y)) {
            return {
                exito: false,
                error: `Coordenadas inválidas del edificio destino (${edificioDestino.x}, ${edificioDestino.y})`
            };
        }

        // ========================================
        // VALIDACIÓN 4: Generar matriz de transitabilidad
        // matriz[y][x] = 1 si es transitible (vías), 0 si no lo es
        // ========================================
        const matrizTransitabilidad = this.#generarMatrizTransitabilidad();

        // ========================================
        // VALIDACIÓN 5: Verificar conectividad entre edificios
        // ========================================
        const rutaEncontrada = this.#buscarRutaDijkstra(
            edificioOrigen.x,
            edificioOrigen.y,
            edificioDestino.x,
            edificioDestino.y,
            matrizTransitabilidad
        );

        if (!rutaEncontrada || rutaEncontrada.length === 0) {
            return {
                exito: false,
                error: 'No existe ruta disponible. Los edificios no están conectados por vías.'
            };
        }

        // ========================================
        // Ruta encontrada exitosamente
        // ========================================
        this.decisiones.push({
            tipo: 'planificacion_ruta',
            origen: { id: idEdificioOrigen, x: edificioOrigen.x, y: edificioOrigen.y },
            destino: { id: idEdificioDestino, x: edificioDestino.x, y: edificioDestino.y },
            distancia: rutaEncontrada.length,
            turno: this.ciudad.turnoActual
        });

        this.accionesTurno++;
        return {
            exito: true,
            ruta: rutaEncontrada
        };
    }

    /**
     * Genera una matriz de transitabilidad donde:
     * - 1 = transitible (vías o edificios)
     * - 0 = no transitible (vacío o terreno)
     * 
     * @private
     * @returns {Array<Array<number>>} Matriz de transitabilidad
     */
    #generarMatrizTransitabilidad() {
        const mapa = this.ciudad.mapa;
        const matriz = Array(mapa.alto).fill(null).map(() => Array(mapa.ancho).fill(0));

        for (let y = 0; y < mapa.alto; y++) {
            for (let x = 0; x < mapa.ancho; x++) {
                const tipo = mapa.obtenerCelda(x, y);
                
                // Las vías (r) siempre son transitables
                if (tipo === 'r') {
                    matriz[y][x] = 1;
                }
                // Los edificios también son transitables (destinos posibles)
                else if (tipo !== 'g') {
                    matriz[y][x] = 1;
                }
                // El terreno vacío (g) no es transitible
                else {
                    matriz[y][x] = 0;
                }
            }
        }

        return matriz;
    }

    /**
     * Implementa el algoritmo de Dijkstra para encontrar la ruta más corta.
     * 
     * @private
     * @param {number} origenX - Coordenada X del origen
     * @param {number} origenY - Coordenada Y del origen
     * @param {number} destinoX - Coordenada X del destino
     * @param {number} destinoY - Coordenada Y del destino
     * @param {Array<Array<number>>} matriz - Matriz de transitabilidad
     * @returns {Array|null} Array de coordenadas {x, y} o null si no existe ruta
     */
    #buscarRutaDijkstra(origenX, origenY, destinoX, destinoY, matriz) {
        const alto = matriz.length;
        const ancho = matriz[0].length;

        // Inicializar distancias y visitados
        const distancias = Array(alto).fill(null).map(() => Array(ancho).fill(Infinity));
        const visitados = Array(alto).fill(null).map(() => Array(ancho).fill(false));
        const padre = Array(alto).fill(null).map(() => Array(ancho).fill(null));

        distancias[origenY][origenX] = 0;

        // Direcciones de movimiento: arriba, abajo, izquierda, derecha
        const direcciones = [
            { dx: 0, dy: -1 }, // arriba
            { dx: 0, dy: 1 },  // abajo
            { dx: -1, dy: 0 }, // izquierda
            { dx: 1, dy: 0 }   // derecha
        ];

        // Ejecutar algoritmo de Dijkstra
        for (let i = 0; i < alto * ancho; i++) {
            let minDist = Infinity;
            let minX = -1, minY = -1;

            // Encontrar el nodo no visitado con menor distancia
            for (let y = 0; y < alto; y++) {
                for (let x = 0; x < ancho; x++) {
                    if (!visitados[y][x] && distancias[y][x] < minDist) {
                        minDist = distancias[y][x];
                        minX = x;
                        minY = y;
                    }
                }
            }

            if (minX === -1) break; // No hay más nodos alcanzables

            visitados[minY][minX] = true;

            // Si llegamos al destino
            if (minX === destinoX && minY === destinoY) {
                return this.#reconstruirRuta(padre, destinoX, destinoY);
            }

            // Explorar vecinos
            for (const dir of direcciones) {
                const nuevoX = minX + dir.dx;
                const nuevoY = minY + dir.dy;

                if (nuevoX >= 0 && nuevoX < ancho && nuevoY >= 0 && nuevoY < alto &&
                    !visitados[nuevoY][nuevoX] && matriz[nuevoY][nuevoX] === 1) {
                    
                    const nuevaDistancia = distancias[minY][minX] + 1;
                    
                    if (nuevaDistancia < distancias[nuevoY][nuevoX]) {
                        distancias[nuevoY][nuevoX] = nuevaDistancia;
                        padre[nuevoY][nuevoX] = { x: minX, y: minY };
                    }
                }
            }
        }

        return null; // No existe ruta
    }

    /**
     * Reconstruye la ruta desde el destino al origen utilizando el array de padres.
     * 
     * @private
     * @param {Array<Array<Object>>} padre - Matriz con referencias al nodo anterior
     * @param {number} destinoX - Coordenada X del destino
     * @param {number} destinoY - Coordenada Y del destino
     * @returns {Array} Array de coordenadas {x, y} ordenadas desde origen a destino
     */
    #reconstruirRuta(padre, destinoX, destinoY) {
        const ruta = [];
        let actual = { x: destinoX, y: destinoY };

        while (actual !== null) {
            ruta.unshift(actual);
            actual = padre[actual.y][actual.x];
        }

        return ruta;
    }

    /**
     * Calcula la experiencia ganada en el turno actual y actualiza el nivel si es necesario.
     */
    calcularExperienciaTurno() {
        // Experiencia basada en acciones realizadas y bienestar de ciudadanos
        const experienciaBase = this.accionesTurno * 10;
        const bienestar = this.verificarBienestarCiudadanos();
        const bonusBienestar = bienestar.porcentajeFelicidad * 2;

        const experienciaGanada = experienciaBase + bonusBienestar;
        this.experiencia += experienciaGanada;

        // Actualizar nivel (cada 1000 puntos de experiencia un nivel)
        this.nivel = Math.floor(this.experiencia / 1000) + 1;

        // Resetear contador de acciones para el siguiente turno
        this.accionesTurno = 0;

        return experienciaGanada;
    }

    /**
     * Obtiene un resumen del estado actual del alcalde.
     * @returns {Object} - Resumen de estadísticas del alcalde
     */
    getResumen() {
        return {
            nombre: this.nombre,
            nivel: this.nivel,
            experiencia: this.experiencia,
            puntuacion: this.puntuacion,
            edificiosConstruidos: this.edificiosConstruidos,
            edificiosDemolidos: this.edificiosDemolidos,
            recursosGestionados: this.recursosGestionados,
            decisionesTotales: this.decisiones.length
        };
    }
}

export { Alcalde };
