
import ServicioClima from '../acceso_datos/ServicioClima.js?v=2';
import ServicioNoticias from '../acceso_datos/ServicioNoticias.js?v=2';
import { Alcalde } from './Alcalde.js';
import { crearEdificioDesdeTipo, reconstruirEdificioDesdeEstado } from './EdificioFactory.js';
import { Mapa } from './Mapa.js';
class Ciudad {
    constructor(nombre, nombreAlcalde, region, ancho, alto) {
        // Identificación de la ciudad
        this.nombre = (nombre || "Nueva Ciudad").substring(0, 50);
        
        // Alcalde que gestiona la ciudad
        this.alcalde = new Alcalde(1, nombreAlcalde ? nombreAlcalde.substring(0, 50) : "Alcalde", this);

        // Región geográfica
        this.region = region || {
            nombre: "Bogotá",
            coordenadas: { lat: 4.6097, lon: -74.0817 }
        };

        // Dimensiones del territorio
        this.ancho = Math.min(Math.max(Number(ancho) || 15, 15), 30);
        this.alto = Math.min(Math.max(Number(alto) || 15, 15), 30);
        
        // Mapa de la ciudad
        this.mapa = new Mapa(this.ancho, this.alto);

        // Servicios externos
        // En el navegador no existe `process.env`, por eso usamos una comprobación segura.
        const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
        const openWeatherKey = env.OPENWEATHER_API_KEY || 'API_KEY_PLACEHOLDER';
        const newsApiKey = env.NEWS_API_KEY || 'API_KEY_PLACEHOLDER';

        this.servicioClima = new ServicioClima(openWeatherKey, this.region.coordenadas.lat, this.region.coordenadas.lon);
        this.servicioNoticias = new ServicioNoticias(newsApiKey, 'ar');

        // Datos climáticos
        this.datosClima = {
            temperatura: 20,
            condicion: 'Soleado',
            humedad: 50,
            velocidadViento: 10,
            ultimaActualizacion: null
        };

        // Noticias actuales
        this.noticias = [];

        // Estado de la simulación
        this.turnoActual = 0;
        this.puntuacionAcumulada = 0;

        // Composición urbana
        this.edificios = [];
        this.vias = [];
        this.poblacion = [];

        // Recursos iniciales
        this.recursos = {
            dinero: 50000,
            electricidad: 0,
            agua: 0,
            comida: 0
        };

        // Parámetros ajustables (crecimiento poblacional)
        // puede ser modificado desde la IU si es necesario.
        this.crecimiento = { min: 1, max: 3 }; // ciudadanos por turno
    }

    /**
     * Inicia los servicios externos (clima y noticias)
     */
    iniciarServiciosExternos() {
        this.servicioClima.iniciarActualizacionAutomatica();
        this.servicioNoticias.iniciarActualizacionAutomatica();
    }

    /**
     * Detiene los servicios externos
     */
    detenerServiciosExternos() {
        this.servicioClima.detenerActualizacion();
        this.servicioNoticias.detenerActualizacion();
    }

    /**
     * Carga un mapa desde un archivo de texto con el formato especificado.
     * El archivo puede contener códigos como g, r, R1, C1, I1, S1, U1, P1, etc.
     * @param {string} textoMapa
     * @returns {{exito: boolean, mensaje?: string, ancho?: number, alto?: number}}
     */
    cargarMapaDesdeTexto(textoMapa) {
        if (!textoMapa || typeof textoMapa !== 'string') {
            return { exito: false, mensaje: 'El contenido del mapa no es válido.' };
        }

        const lineas = textoMapa
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lineas.length === 0) {
            return { exito: false, mensaje: 'El archivo de mapa está vacío.' };
        }

        const tokenPattern = /(R[12]|C[12]|I[12]|S[123]|U[12]|P1|r|g)/g;
        const grid = lineas.map(line => {
            const tokens = [...line.matchAll(tokenPattern)].map(m => m[0]);
            return tokens;
        }).filter(row => row.length > 0);

        if (grid.length === 0) {
            return { exito: false, mensaje: 'No se detectaron celdas válidas en el archivo.' };
        }

        const alto = grid.length;
        const ancho = Math.max(...grid.map(r => r.length));

        if (alto < 15 || alto > 30 || ancho < 15 || ancho > 30) {
            return {
                exito: false,
                mensaje: `Dimensiones inválidas: ${ancho}x${alto}. Deben estar entre 15x15 y 30x30.`
            };
        }

        // Completar filas cortas con terreno vacío
        const gridPadded = grid.map(row => {
            if (row.length < ancho) {
                return [...row, ...Array(ancho - row.length).fill(Mapa.TIPOS_VALIDOS.VACIO)];
            }
            return row;
        });

        // Validar tipos de celdas
        for (const row of gridPadded) {
            for (const token of row) {
                if (!Mapa.esTipoValido(token)) {
                    return { exito: false, mensaje: `Tipo de celda inválido: '${token}'.` };
                }
            }
        }

        // Reiniciar el mapa y los datos que dependen de él
        this.ancho = ancho;
        this.alto = alto;
        this.mapa = new Mapa(ancho, alto);
        this.edificios = [];
        this.vias = [];
        this.poblacion = [];

        // Reiniciar recursos a valores iniciales y ajustar según edificaciones
        this.recursos = {
            dinero: 50000,
            electricidad: 0,
            agua: 0,
            comida: 0
        };

        let costoTotal = 0;

        gridPadded.forEach((row, y) => {
            row.forEach((token, x) => {
                if (token === Mapa.TIPOS_VALIDOS.VACIO) return;

                if (token === Mapa.TIPOS_VALIDOS.VIA) {
                    this.mapa.actualizarCelda(x, y, token);
                    this.vias.push({ x, y, costoConstruccion: this.obtenerCostoConstruccion(token) });
                    costoTotal += this.obtenerCostoConstruccion(token);
                    return;
                }

                const edificio = crearEdificioDesdeTipo(token, x, y);
                if (!edificio) return;

                this.mapa.actualizarCelda(x, y, token);
                this.edificios.push(edificio);
                costoTotal += this.obtenerCostoConstruccion(token);

                // Ajustar recursos iniciales según producción de utilidades
                if (token === 'U1' && typeof edificio.producirRecurso === 'function') {
                    this.recursos.electricidad += edificio.producirRecurso();
                }
                if (token === 'U2' && typeof edificio.producirRecurso === 'function') {
                    this.recursos.agua += edificio.producirRecurso();
                }
                if (token === 'I2' && typeof edificio.calcularProduccion === 'function') {
                    this.recursos.comida += edificio.calcularProduccion();
                }
            });
        });

        // Aplicar costo de construcción al dinero disponible
        this.recursos.dinero = Math.max(0, this.recursos.dinero - costoTotal);

        return { exito: true, ancho, alto };
    }

    /**
     * Permite configurar recursos desde la interfaz
     */
    configurarRecursoDesdeIU(tipo, valor) {
        if (this.recursos.hasOwnProperty(tipo)) {
            this.recursos[tipo] = Number(valor);
        }
    }

    /**
     * Ajusta los parámetros de crecimiento poblacional (min y max ciudadanos por turno).
     * Ambos valores deben ser enteros positivos y min ≤ max.
     */
    configurarCrecimiento(min, max) {
        min = Math.floor(Number(min));
        max = Math.floor(Number(max));
        if (min > 0 && max >= min) {
            this.crecimiento.min = min;
            this.crecimiento.max = max;
        }
    }

    /**
     * Obtiene el costo de construcción asociado a un tipo de edificio.
     * @param {string} tipo
     * @returns {number}
     */
    obtenerCostoConstruccion(tipo) {
        const costos = {
            r: 20,
            R1: 200,
            R2: 400,
            C1: 300,
            C2: 600,
            I1: 500,
            I2: 900,
            S1: 400,
            S2: 700,
            S3: 1000,
            U1: 350,
            U2: 650,
            P1: 250
        };
        return costos[tipo] ?? 100;
    }

    /**
     * Valida si se puede construir en una ubicación (costo, vía adyacente y disponibilidad).
     */
    puedeConstruir(tipo, x, y) {
        const costo = this.obtenerCostoConstruccion(tipo);
        if (this.recursos.dinero < costo) return false;

        // Validar coordenadas y disponibilidad
        if (!this.mapa.esCoordenadaValida(x, y)) return false;
        if (!this.mapa.estaDisponible(x, y)) return false;

        // Las vías pueden construirse en cualquier celda libre (no necesitan estar adyacentes a otra vía)
        if (tipo === 'r') {
            return true;
        }

        // Si no hay ninguna vía construida aún, permitimos construir en cualquier lugar
        // (esto facilita empezar la ciudad, luego ya habrá calles para conectar).
        const tieneVias = this.mapa.obtenerPosicionesPorTipo('r').length > 0;
        if (!tieneVias) return true;

        // Si ya hay vías, exigir que la construcción esté junto a una vía para conectividad.
        const vecinos = this.mapa.obtenerVecinos(x, y);
        const tieneViaAdyacente = vecinos.some(([vx, vy]) => this.mapa.obtenerCelda(vx, vy) === 'r');

        return tieneViaAdyacente;
    }

    /**
     * Procesa un turno de la simulación
     */
    procesarTurno() {
        this.turnoActual++;

        // Verificar condiciones críticas de derrota
        if (this.recursos.electricidad < 0 || this.recursos.agua < 0 || this.recursos.dinero < 0) {
            this.finalizarJuego("Recursos negativos detectados");
            return;
        }

        // Procesar producción y consumo de recursos
        this.procesarProduccionRecursos();
        this.procesarConsumoRecursos();
        this.procesarIngresos();
        this.procesarCostos();

        // Actualizar ciudadanos
        this.actualizarFelicidadCiudadanos();
        this.#aplicarEfectosClimaticos();
        this.#procesarEventosNoticias();
        this.#gestionarCrecimientoPoblacional();
        // Asignaciones automáticas tras la creación de nuevos residentes
        this.#asignarAutomaticamente();

        // Actualizar puntuación
        this.#actualizarPuntuacion();

        // Actualizar datos de servicios externos
        this.#actualizarDatosExternos();
    }

    /**
     * Gestiona el crecimiento poblacional
     */
    #gestionarCrecimientoPoblacional() {
        const felicidadPromedio = this.obtenerFelicidadPromedio();
        const capacidadVivienda = this.edificios
            .filter(e => e.tipo.startsWith('R'))
            .reduce((acc, e) => acc + (e.capacidadMaxima || 0), 0);

        const empleosDisponibles = this.calcularEmpleosDisponibles();

        // Condiciones: vivienda suficiente, felicidad alta y al menos un empleo libre
        if (
            felicidadPromedio > 60 &&
            this.poblacion.length < capacidadVivienda &&
            empleosDisponibles > 0
        ) {
            const rango = this.crecimiento.max - this.crecimiento.min + 1;
            const nuevos = Math.floor(Math.random() * rango) + this.crecimiento.min;
            for (let i = 0; i < nuevos; i++) {
                this.poblacion.push({
                    id: Date.now() + i,
                    nivelFelicidad: 50,
                    estadoVivienda: false,
                    estadoEmpleo: false
                });
            }
        }
    }

    /**
     * Aplica efectos climáticos a la felicidad de los ciudadanos
     */
    #aplicarEfectosClimaticos() {
        const ajusteClima = this.#calcularAjusteFelicidadClima();
        
        this.poblacion.forEach(ciudadano => {
            ciudadano.nivelFelicidad += ajusteClima;
            ciudadano.nivelFelicidad = Math.max(0, Math.min(100, ciudadano.nivelFelicidad));
        });
    }

    /**
     * Calcula el ajuste de felicidad basado en el clima actual
     */
    #calcularAjusteFelicidadClima() {
        const condicion = this.datosClima.condicion.toLowerCase();
        
        switch (condicion) {
            case 'soleado':
                return 5;
            case 'lluvioso':
            case 'llovizna':
                return -3;
            case 'tormenta':
                return -10;
            case 'nevado':
            case 'nublado':
                return -5;
            default:
                return 0;
        }
    }

    /**
     * Calcula el multiplicador de producción de comida basado en el clima
     */
    #calcularMultiplicadorProduccionComida() {
        const condicion = this.datosClima.condicion.toLowerCase();
        
        switch (condicion) {
            case 'lluvioso':
            case 'llovizna':
                return 1.5; // Lluvia aumenta producción agrícola
            case 'soleado':
                return 1.2; // Sol bueno para agricultura
            case 'tormenta':
                return 0.7; // Tormentas dañan cosechas
            case 'nevado':
                return 0.5; // Nieve reduce producción
            case 'nublado':
                return 0.9; // Nublado reduce ligeramente
            default:
                return 1.0; // Condición normal
        }
    }

    /**
     * Procesa eventos aleatorios basados en noticias que afectan la simulación
     */
    #procesarEventosNoticias() {
        if (this.noticias.length === 0 || Math.random() > 0.1) return; // 10% chance de evento
        
        const noticiaAleatoria = this.noticias[Math.floor(Math.random() * this.noticias.length)];
        const titulo = noticiaAleatoria.titulo.toLowerCase();
        
        // Eventos basados en contenido de noticias
        if (titulo.includes('crisis') || titulo.includes('recesión')) {
            // Crisis económica: reduce ingresos
            this.recursos.dinero *= 0.95;
            console.log('Evento noticioso: Crisis económica detectada, ingresos reducidos');
        } else if (titulo.includes('desastre') || titulo.includes('accidente')) {
            // Desastre: reduce felicidad
            this.poblacion.forEach(c => c.nivelFelicidad = Math.max(0, c.nivelFelicidad - 10));
            console.log('Evento noticioso: Desastre reportado, felicidad ciudadana afectada');
        } else if (titulo.includes('éxito') || titulo.includes('avance')) {
            // Noticia positiva: aumenta felicidad
            this.poblacion.forEach(c => c.nivelFelicidad = Math.min(100, c.nivelFelicidad + 5));
            console.log('Evento noticioso: Noticia positiva, felicidad ciudadana aumentada');
        }
    }

    /**
     * Calcula la puntuación actual
     */
    #actualizarPuntuacion() {
        const felicidad = this.obtenerFelicidadPromedio();
        const numEdificios = this.edificios.length;
        const desempleados = this.poblacion.filter(c => !c.estadoEmpleo).length;
        
        let score = (this.poblacion.length * 10) + 
                    (felicidad * 5) + 
                    (this.recursos.dinero / 100) + 
                    (numEdificios * 50) +
                    (this.recursos.electricidad * 2) +
                    (this.recursos.agua * 2);

        // Penalizaciones
        score -= (desempleados * 10);
        if (this.recursos.dinero < 0) score -= 500;
        if (this.recursos.electricidad < 0) score -= 300;
        if (this.recursos.agua < 0) score -= 300;
        if (felicidad < 40) score -= 400;

        // Bonificaciones
        if (desempleados === 0) score += 500;
        if (felicidad > 80) score += 300;
        if (this.recursos.dinero > 0 && this.recursos.electricidad > 0 && this.recursos.agua > 0 && this.recursos.comida > 0) score += 200;
        if (this.poblacion.length > 1000) score += 1000;

        this.puntuacionAcumulada = score;
    }

    /**
     * Actualiza los datos locales de servicios externos
     */
    #actualizarDatosExternos() {
        // Actualizar clima
        const climaActual = this.servicioClima.obtenerDatosClimaActuales();
        if (climaActual.ultimaActualizacion) {
            this.datosClima = { ...climaActual };
        }

        // Actualizar noticias
        this.noticias = this.servicioNoticias.obtenerNoticiasActuales();
    }

    /**
     * Calcula la felicidad promedio de los ciudadanos
     */
    obtenerFelicidadPromedio() {
        if (this.poblacion.length === 0) return 0;
        return this.poblacion.reduce((a, b) => a + b.nivelFelicidad, 0) / this.poblacion.length;
    }

    finalizarJuego(motivo) {
        console.error(`GAME OVER: ${motivo}`);
    }

    // ============================================
    // UTILIDADES PRIVADAS
    // ============================================

    /**
     * Calcula la cantidad total de puestos de trabajo libres en la ciudad.
     * Se basa en edificios que admiten empleados (comercio, industria, servicios, utilidades).
     * @returns {number} Vacantes disponibles
     */
    calcularEmpleosDisponibles() {
        let vacantes = 0;
        this.edificios.forEach(e => {
            if (e.capacidadMaxima && typeof e.ocupacionActual === 'number') {
                vacantes += Math.max(0, e.capacidadMaxima - e.ocupacionActual);
            }
        });
        return vacantes;
    }

    /**
     * Asigna vivienda y/o empleo a todos los ciudadanos que no lo tengan,
     * siempre que existan edificios con capacidad libre.
     */
    #asignarAutomaticamente() {
        this.poblacion.forEach(ciudadano => {
            if (!ciudadano.estadoVivienda) {
                const vivienda = this.edificios.find(e =>
                    e.tipo.startsWith('R') &&
                    e.ocupacionActual < e.capacidadMaxima &&
                    typeof e.asignarCiudadano === 'function'
                );
                if (vivienda && vivienda.asignarCiudadano(ciudadano.id)) {
                    ciudadano.asignarVivienda();
                }
            }

            if (!ciudadano.estadoEmpleo) {
                const empleo = this.edificios.find(e =>
                    typeof e.asignarEmpleado === 'function' &&
                    e.ocupacionActual < e.capacidadMaxima
                );
                if (empleo && empleo.asignarEmpleado(ciudadano.id)) {
                    ciudadano.asignarEmpleo();
                }
            }
        });
    }

    // ============================================
    // GESTIÓN DE EDIFICIOS
    // ============================================

    /**
     * Añade un edificio a la colección de la ciudad
     */
    agregarEdificio(edificio) {
        if (!edificio || !edificio.id) return false;
        this.edificios.push(edificio);
        return true;
    }

    /**
     * Remueve un edificio por su ID
     */
    removerEdificio(id) {
        const index = this.edificios.findIndex(e => e.id === id);
        if (index > -1) {
            this.edificios.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Obtiene un edificio específico por su ID
     */
    obtenerEdificio(id) {
        return this.edificios.find(e => e.id === id) || null;
    }

    /**
     * Obtiene todos los edificios de un tipo específico
     */
    obtenerEdificiosPorTipo(tipo) {
        return this.edificios.filter(e => e.tipo === tipo);
    }

    /**
     * Obtiene edificios productores de un recurso
     */
    obtenerProductoresDeRecurso(tipoRecurso) {
        return this.edificios.filter(e => {
            if (tipoRecurso === 'electricidad') return e.tipo === 'U1';
            if (tipoRecurso === 'agua') return e.tipo === 'U2';
            if (tipoRecurso === 'comida') return e.tipo.startsWith('I');
            return false;
        });
    }

    // ============================================
    // GESTIÓN DE CIUDADANOS
    // ============================================

    /**
     * Añade un ciudadano a la ciudad
     */
    agregarCiudadano(ciudadano) {
        if (!ciudadano || !ciudadano.id) return false;
        this.poblacion.push(ciudadano);
        return true;
    }

    /**
     * Remueve un ciudadano de la ciudad
     */
    removerCiudadano(id) {
        const index = this.poblacion.findIndex(c => c.id === id);
        if (index > -1) {
            this.poblacion.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Obtiene un ciudadano específico por ID
     */
    obtenerCiudadano(id) {
        return this.poblacion.find(c => c.id === id) || null;
    }

    /**
     * Asigna un ciudadano a una vivienda
     */
    asignarCiudadanoAVivienda(idCiudadano, idVivienda) {
        const ciudadano = this.obtenerCiudadano(idCiudadano);
        const vivienda = this.obtenerEdificio(idVivienda);

        if (!ciudadano || !vivienda) return false;
        if (!vivienda.tipo.startsWith('R')) return false;
        if (!vivienda.asignarCiudadano) return false;

        if (vivienda.asignarCiudadano(idCiudadano)) {
            ciudadano.asignarVivienda();
            return true;
        }
        return false;
    }

    /**
     * Desasigna un ciudadano de su vivienda
     */
    desasignarCiudadanoDeVivienda(idCiudadano, idVivienda) {
        const ciudadano = this.obtenerCiudadano(idCiudadano);
        const vivienda = this.obtenerEdificio(idVivienda);

        if (!ciudadano || !vivienda) return false;

        if (vivienda.desasignarCiudadano && vivienda.desasignarCiudadano(idCiudadano)) {
            ciudadano.desasignarVivienda();
            return true;
        }
        return false;
    }

    /**
     * Asigna un ciudadano a un trabajo
     */
    asignarCiudadanoATrabajo(idCiudadano, idEdificio) {
        const ciudadano = this.obtenerCiudadano(idCiudadano);
        const edificio = this.obtenerEdificio(idEdificio);

        if (!ciudadano || !edificio) return false;
        if (!edificio.asignarEmpleado) return false;

        if (edificio.asignarEmpleado(idCiudadano)) {
            ciudadano.asignarEmpleo();
            return true;
        }
        return false;
    }

    /**
     * Desasigna un ciudadano de su trabajo
     */
    desasignarCiudadanoDeTrabajo(idCiudadano, idEdificio) {
        const ciudadano = this.obtenerCiudadano(idCiudadano);
        const edificio = this.obtenerEdificio(idEdificio);

        if (!ciudadano || !edificio) return false;
        if (!edificio.desasignarEmpleado) return false;

        if (edificio.desasignarEmpleado(idCiudadano)) {
            ciudadano.desasignarEmpleo();
            return true;
        }
        return false;
    }

    /**
     * Actualiza la felicidad de todos los ciudadanos
     */
    actualizarFelicidadCiudadanos() {
        // calcular bono por instalaciones de servicios / parques
        const bonusServicios = this.edificios.filter(e =>
            ['P1', 'S1', 'S2', 'S3'].includes(e.tipo)
        ).length * 2; // 2 puntos por cada edificio de servicio/parque

        // Efectos climáticos en la felicidad
        let efectoClima = 0;
        switch (this.datosClima.condicion) {
            case 'Soleado':
                efectoClima = 5; // Clima agradable aumenta felicidad
                break;
            case 'Nublado':
                efectoClima = 0; // Neutro
                break;
            case 'Lluvioso':
            case 'Llovizna':
                efectoClima = -3; // Lluvia afecta negativamente
                break;
            case 'Tormenta':
                efectoClima = -10; // Tormentas reducen significativamente la felicidad
                break;
            case 'Nevado':
                efectoClima = -5; // Nieve puede ser problemática
                break;
            default:
                efectoClima = 0;
        }

        this.poblacion.forEach(ciudadano => {

            ciudadano.actualizarFelicidad();

            // aplicar adicional de servicios y clima
            ciudadano.nivelFelicidad = Math.min(100, Math.max(0, ciudadano.nivelFelicidad + bonusServicios));
        });
    }

    // ============================================
    // GESTIÓN DE VÍAS
    // ============================================

    /**
     * Añade una vía a la ciudad
     */
    agregarVia(via) {
        if (!via) return false;
        this.vias.push(via);
        return true;
    }

    /**
     * Remueve una vía de la ciudad
     */
    removerVia(index) {
        if (index < 0 || index >= this.vias.length) return false;
        this.vias.splice(index, 1);
        return true;
    }

    // ============================================
    // GESTIÓN DE RECURSOS
    // ============================================

    /**
     * Gasta dinero de la ciudad
     */
    gastarDinero(cantidad) {
        if (this.recursos.dinero >= cantidad) {
            this.recursos.dinero -= cantidad;
            return true;
        }
        return false;
    }

    /**
     * Ingresa dinero a la ciudad
     */
    ingresarDinero(cantidad) {
        this.recursos.dinero += cantidad;
    }

    /**
     * Obtiene el dinero disponible
     */
    obtenerDinero() {
        return this.recursos.dinero;
    }

    /**
     * Procesa la producción de recursos
     */
    procesarProduccionRecursos() {
        const plantasElectricidad = this.obtenerEdificiosPorTipo('U1');
        let prodElectricidad = 0;
        plantasElectricidad.forEach(planta => {
            if (planta.estaOperativo && planta.producirRecurso) {
                prodElectricidad += planta.producirRecurso();
            }
        });

        const plantasAgua = this.obtenerEdificiosPorTipo('U2');
        let prodAgua = 0;
        plantasAgua.forEach(planta => {
            if (planta.estaOperativo && planta.producirRecurso) {
                prodAgua += planta.producirRecurso();
            }
        });

        const granjas = this.edificios.filter(e => e.tipo === 'I2' && e.estaOperativo);
        let prodComida = 0;
        granjas.forEach(granja => {
            if (granja.calcularProduccion) {
                prodComida += granja.calcularProduccion();
            }
        });

        // Aplicar multiplicador climático a la producción de alimentos
        const multiplicadorClima = this.#calcularMultiplicadorProduccionComida();
        prodComida *= multiplicadorClima;

        this.recursos.electricidad += prodElectricidad;
        this.recursos.agua += prodAgua;
        this.recursos.comida += prodComida;
    }

    /**
     * Procesa el consumo de recursos
     */
    procesarConsumoRecursos() {
        let consumoElectricidad = 0;
        let consumoAgua = 0;
        let consumoComida = 0;

        this.edificios.forEach(edificio => {
            if (edificio.estaOperativo) {
                consumoElectricidad += edificio.consumoElectricidad || 0;
                consumoAgua += edificio.consumoAgua || 0;
                consumoComida += (edificio.ocupacionActual || 0) * 1;
            }
        });

        this.recursos.electricidad -= consumoElectricidad;
        this.recursos.agua -= consumoAgua;
        this.recursos.comida -= consumoComida;

        this.edificios.forEach(edificio => {
            if (this.recursos.electricidad < 0 || this.recursos.agua < 0) {
                edificio.estaOperativo = false;
            }
        });
    }

    /**
     * Procesa ingresos de comercios e industriales
     */
    procesarIngresos() {
        let ingresosTotales = 0;

        const comercios = this.edificios.filter(e => e.tipo.startsWith('C'));
        comercios.forEach(comercio => {
            if (comercio.estaOperativo && comercio.calcularIngresos) {
                ingresosTotales += comercio.calcularIngresos();
            }
        });

        const industriales = this.edificios.filter(e => e.tipo === 'I1'); // Solo fábricas producen dinero
        industriales.forEach(industrial => {
            if (industrial.estaOperativo && industrial.calcularIngresos) {
                ingresosTotales += industrial.calcularIngresos();
            }
        });

        this.ingresarDinero(ingresosTotales);
    }

    /**
     * Procesa costos operativos y mantenimiento
     */
    procesarCostos() {
        let costosTotales = 0;

        this.edificios.forEach(edificio => {
            if (edificio.mantenimientoPorTurno) {
                costosTotales += edificio.mantenimientoPorTurno;
            }
        });

        this.vias.forEach(via => {
            if (via.costoConstruccion) {
                costosTotales += via.costoConstruccion * 0.1;
            }
        });

        this.gastarDinero(costosTotales);
    }

    // ============================================
    // CONSULTAS Y ESTADÍSTICAS
    // ============================================

    /**
     * Retorna totales de producción/consumo por recurso (electricidad/agua).
     */
    getResourceTotals() {
        let elecProd = 0, elecCons = 0;
        let aguaProd = 0, aguaCons = 0;

        this.edificios.forEach(e => {
            if (e.estaOperativo) {
                elecCons += e.consumoElectricidad || 0;
                aguaCons += e.consumoAgua || 0;
            }
            if (e.producirRecurso) {
                if (e.tipo === 'U1') elecProd += e.producirRecurso();
                if (e.tipo === 'U2') aguaProd += e.producirRecurso();
            }
        });

        return { elecProd, elecCons, aguaProd, aguaCons };
    }

    /**
     * Bonificación global de felicidad por servicios y parques.
     */
    getGlobalHappinessBonus() {
        const cantidad = this.edificios.filter(e =>
            ['P1', 'S1', 'S2', 'S3'].includes(e.tipo)
        ).length;
        return cantidad * 2;
    }

    getTotalHousingCapacity() {
        return this.edificios
            .filter(e => e.tipo.startsWith('R'))
            .reduce((acc, e) => acc + (e.capacidadMaxima || 0), 0);
    }

    getTotalJobs() {
        return this.edificios
            .filter(e => !e.tipo.startsWith('R'))
            .reduce((acc, e) => acc + (e.capacidadMaxima || 0), 0);
    }

    getAvailableHousing() {
        return Math.max(0, this.getTotalHousingCapacity() - this.poblacion.length);
    }

    getAvailableJobs() {
        const employed = this.poblacion.filter(c => c.estadoEmpleo).length;
        return Math.max(0, this.getTotalJobs() - employed);
    }

    /**
     * Serializa la ciudad a un objeto simple (JSON). Adecuado para guardado.
     */
    toJSON() {
        return {
            nombre: this.nombre,
            alcalde: this.alcalde ? this.alcalde.nombre : null,
            region: this.region,
            ancho: this.ancho,
            alto: this.alto,
            turnoActual: this.turnoActual,
            puntuacionAcumulada: this.puntuacionAcumulada,
            edificios: this.edificios.map(e => e.obtenerEstado()),
            vias: this.vias.slice(),
            poblacion: this.poblacion.slice(),
            recursos: { ...this.recursos },
            crecimiento: { ...this.crecimiento },
            mapa: this.mapa.exportarMapa()
        };
    }

    /**
     * Reconstruye una ciudad a partir de un objeto creado por toJSON.
     * Nota: las edificaciones devueltas serán objetos planos, no instancias.
     */
    static fromJSON(data) {
        const c = new Ciudad(data.nombre, data.alcalde, data.region, data.ancho, data.alto);
        c.turnoActual = data.turnoActual || 0;
        c.puntuacionAcumulada = data.puntuacionAcumulada || 0;

        // Restaurar mapa (grid) si se ha guardado
        if (Array.isArray(data.mapa)) {
            for (let y = 0; y < Math.min(c.alto, data.mapa.length); y++) {
                for (let x = 0; x < Math.min(c.ancho, data.mapa[y].length); x++) {
                    c.mapa.grid[y][x] = data.mapa[y][x];
                }
            }
        }

        // Reconstruir instancias de edificios desde el estado serializado
        c.edificios = (data.edificios || []).map(reconstruirEdificioDesdeEstado).filter(e => e !== null);
        c.vias = data.vias || [];
        c.poblacion = data.poblacion || [];
        c.recursos = data.recursos || c.recursos;
        c.crecimiento = data.crecimiento || c.crecimiento;

        return c;
    }

    /**
     * Obtiene el estado general de la ciudad
     */
    obtenerEstadoGeneral() {
        return {
            nombre: this.nombre,
            turno: this.turnoActual,
            puntuacion: this.puntuacionAcumulada,
            poblacion: {
                total: this.poblacion.length,
                conVivienda: this.poblacion.filter(c => c.estadoVivienda).length,
                conEmpleo: this.poblacion.filter(c => c.estadoEmpleo).length,
                felicidadPromedio: Math.round(this.obtenerFelicidadPromedio())
            },
            edificios: {
                total: this.edificios.length,
                residenciales: this.edificios.filter(e => e.tipo.startsWith('R')).length,
                comerciales: this.edificios.filter(e => e.tipo.startsWith('C')).length,
                industriales: this.edificios.filter(e => e.tipo.startsWith('I')).length,
                servicios: this.edificios.filter(e => e.tipo.startsWith('S')).length,
                utilidades: this.edificios.filter(e => e.tipo.startsWith('U')).length,
                parques: this.edificios.filter(e => e.tipo === 'P1').length
            },
            recursos: {
                dinero: this.recursos.dinero,
                electricidad: this.recursos.electricidad,
                agua: this.recursos.agua,
                comida: this.recursos.comida
            },
            clima: { ...this.datosClima },
            noticias: [...this.noticias],
            mapa: {
                ...this.mapa.obtenerEstadisticasMapa(),
                grid: this.mapa.grid
            }
        };
    }

    /**
     * Obtiene estadísticas detalladas de la ciudad
     */
    obtenerEstadisticasCiudad() {
        return {
            tiempoTranscurrido: `Turno ${this.turnoActual}`,
            tasaCrecimiento: this.poblacion.length > 0 ? 
                ((this.poblacion.length / Math.max(this.turnoActual, 1)) * 100).toFixed(2) + '%' : '0%',
            tasaDesempleo: this.poblacion.length > 0 ?
                ((this.poblacion.filter(c => !c.estadoEmpleo).length / this.poblacion.length) * 100).toFixed(2) + '%' : '0%',
            ingresosPorTurno: this.edificios.filter(e => e.calcularIngresos).reduce((acc, e) => 
                acc + (e.calcularIngresos ? e.calcularIngresos() : 0), 0),
            tasaOcupacionLaboral: this.poblacion.length > 0 ?
                ((this.poblacion.filter(c => c.estadoEmpleo).length / this.poblacion.length) * 100).toFixed(2) + '%' : '0%'
        };
    }
}

// Exportar clase para uso en módulos ES
export { Ciudad };
