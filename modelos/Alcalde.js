/**
 * Alcalde.js
 * Clase que representa al alcalde/jugador que gestiona la ciudad.
 * Responsable de las decisiones estratégicas y operaciones de la ciudad.
 */
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
            return false;
        }

        // Intentar construir el edificio a través del mapa
        const edificioConstruido = this.ciudad.mapa.construirEdificio(tipo, x, y);

        if (edificioConstruido) {
            this.edificiosConstruidos++;
            this.decisiones.push({
                tipo: 'construccion',
                edificio: tipo,
                coordenadas: { x, y },
                turno: this.ciudad.turnoActual
            });
            this.accionesTurno++;
            return true;
        }

        return false;
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

        return false;
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
     * Planifica una ruta de transporte entre dos puntos de la ciudad.
     * @param {Object} inicio - Punto de inicio {x, y}
     * @param {Object} fin - Punto final {x, y}
     * @returns {Array} - Array de coordenadas que forman la ruta
     */
    planificarRuta(inicio, fin) {
        // Implementación básica de pathfinding (puede expandirse)
        // Por ahora retorna una ruta directa simplificada
        const ruta = [];
        const dx = fin.x - inicio.x;
        const dy = fin.y - inicio.y;

        // Ruta simplificada: movimiento horizontal primero, luego vertical
        for (let x = inicio.x; x !== fin.x; x += Math.sign(dx)) {
            ruta.push({ x, y: inicio.y });
        }
        for (let y = inicio.y; y !== fin.y; y += Math.sign(dy)) {
            ruta.push({ x: fin.x, y });
        }

        this.decisiones.push({
            tipo: 'planificacion_ruta',
            inicio,
            fin,
            ruta: ruta.length,
            turno: this.ciudad.turnoActual
        });

        this.accionesTurno++;
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