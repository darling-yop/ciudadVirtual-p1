
import ServicioClima from '../acceso_datos/ServicioClima.js?v=2';
import ServicioNoticias from '../acceso_datos/ServicioNoticias.js?v=2';
import { Alcalde } from './Alcalde.js';
import { Ciudadano } from './Ciudadano.js';
import { crearEdificioDesdeTipo, reconstruirEdificioDesdeEstado } from './EdificioFactory.js';
import { Mapa } from './Mapa.js';

function inferirCountryCode(region = {}) {
    const existente = String(region?.countryCode || '').trim().toLowerCase();
    if (existente) return existente;

    const nombre = String(region?.nombre || '').toLowerCase();
    if (nombre.includes('mexico')) return 'mx';
    if (nombre.includes('madrid') || nombre.includes('espa')) return 'es';
    if (nombre.includes('buenos aires') || nombre.includes('argentina')) return 'ar';
    if (nombre.includes('colombia') || nombre.includes('bogota') || nombre.includes('medellin') || nombre.includes('cali')) return 'co';

    return 'co';
}

function normalizarRegion(region) {
    const base = region || {
        nombre: 'Bogotá',
        coordenadas: { lat: 4.6097, lon: -74.0817 }
    };

    return {
        ...base,
        countryCode: inferirCountryCode(base)
    };
}

function generarIdCiudad(nombre = 'ciudad') {
    const base = String(nombre)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'ciudad';

    return `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

class Ciudad {
    constructor(nombre, nombreAlcalde, region, ancho, alto) {
        // Identificación de la ciudad
        this.nombre = (nombre || "Nueva Ciudad").substring(0, 50);
        this.cityId = generarIdCiudad(this.nombre);
        
        // Alcalde que gestiona la ciudad
        this.alcalde = new Alcalde(1, nombreAlcalde ? nombreAlcalde.substring(0, 50) : "Alcalde", this);

        // Región geográfica
        this.region = normalizarRegion(region);

        // Dimensiones del territorio
        this.ancho = Math.min(Math.max(Number(ancho) || 15, 15), 30);
        this.alto = Math.min(Math.max(Number(alto) || 15, 15), 30);
        
        // Mapa de la ciudad
        this.mapa = new Mapa(this.ancho, this.alto);

        // Servicios externos
        this.servicioClima = new ServicioClima(this.region.coordenadas.lat, this.region.coordenadas.lon, this.nombre);
        this.servicioNoticias = new ServicioNoticias(this.region.countryCode);

        // Datos climáticos - instancia de Clima
        this.datosClima = null;

        // Noticias actuales - array de instancias de Noticia
        this.noticias = [];

        // Estado de la simulación
        this.turnoActual = 0;
        this.puntuacionAcumulada = 0;

        // Composición urbana
        this.edificios = [];
        this.vias = [];
        this.poblacion = [];
        this.juegoFinalizado = false;
        this.motivoFinJuego = null;
        this.turnosConDeficit = 0; // Contador de turnos consecutivos con déficit crítico
        this.MAX_TURNOS_DEFICIT = 3; // Máximo de turnos que puede haber déficit antes de game-over

        // Recursos iniciales (aumentados para evitar game-over inmediato)
        this.recursos = {
            dinero: 50000,
            electricidad: 0,
            agua: 0,
            alimentos: 0,
            comida: 0
        };

        // Histórico de recursos para análisis y gráficos (últimos 20 turnos).
        this.historicoRecursos = [];
        this.#registrarHistoricoRecursos();

        // Parámetros ajustables (crecimiento poblacional)
        // puede ser modificado desde la IU si es necesario.
        this.crecimiento = { min: 1, max: 3 }; // ciudadanos por turno
    }

    #normalizarRecursos() {
        this.recursos.dinero = Number(this.recursos.dinero ?? 0);
        this.recursos.electricidad = Number(this.recursos.electricidad ?? 0);
        this.recursos.agua = Number(this.recursos.agua ?? 0);

        const alimentos = Number(this.recursos.alimentos ?? this.recursos.comida ?? 0);
        this.recursos.alimentos = alimentos;
        this.recursos.comida = alimentos;
    }

    /**
     * Inicia los servicios externos (clima y noticias)
     */
    async iniciarServiciosExternos() {
        try {
            // Los servicios ahora usan las API keys desde config.js
            await this.servicioClima.iniciarActualizacionAutomatica();
            console.log('Servicio de Clima iniciado correctamente');

            await this.servicioNoticias.iniciarActualizacionAutomatica();
            console.log('Servicio de Noticias iniciado correctamente');

            // Actualizar datos locales después de la carga inicial
            this.#actualizarDatosExternos();
            console.log("Clima:", this.datosClima);
            console.log("Noticias:", this.noticias);
        } catch (error) {
            console.error('Error al iniciar servicios externos:', error);
            throw error;
        }
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
            alimentos: 0,
            comida: 0
        };
        this.historicoRecursos = [];

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
                    const produccionInicial = Number(edificio.calcularProduccion()) || 0;
                    this.recursos.alimentos += produccionInicial;
                    this.recursos.comida += produccionInicial;
                }
            });
        });

        // Aplicar costo de construcción al dinero disponible
        this.recursos.dinero = Math.max(0, this.recursos.dinero - costoTotal);
        this.#registrarHistoricoRecursos();

        return { exito: true, ancho, alto };
    }

    /**
     * Permite configurar recursos desde la interfaz
     */
    configurarRecursoDesdeIU(tipo, valor) {
        if (this.recursos.hasOwnProperty(tipo)) {
            this.recursos[tipo] = Number(valor);
            if (tipo === 'alimentos' || tipo === 'comida') {
                this.recursos.alimentos = Number(valor);
                this.recursos.comida = Number(valor);
            }
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

        // Para cualquier edificio (distinto de vía), exigir conexión vial adyacente.
        const vecinos = this.mapa.obtenerVecinos(x, y);
        const tieneViaAdyacente = vecinos.some(([vx, vy]) => this.mapa.obtenerCelda(vx, vy) === 'r');

        return tieneViaAdyacente;
    }

    /**
     * Procesa un turno de la simulación
     */
    procesarTurno() {
        if (this.juegoFinalizado) {
            console.warn('Turno omitido: el juego ya se ha finalizado.');
            return;
        }

        this.#normalizarRecursos();

        this.turnoActual++;

        // Verificar condiciones críticas de derrota antes de procesar el turno
        if (this.verificarRecursosCriticos()) {
            return;
        }

        // Procesar producción y consumo de recursos
        this.procesarProduccionRecursos();
        this.procesarConsumoRecursos();
        this.procesarIngresos();
        this.procesarCostos();

        // Verificar nuevamente después de aplicar costos y consumos
        if (this.verificarRecursosCriticos()) {
            return;
        }

        // Actualizar ciudadanos
        this.actualizarFelicidadCiudadanos();
        this.#procesarEventosNoticias();
        this.#gestionarCrecimientoPoblacional();
        // Asignaciones automáticas tras la creación de nuevos residentes
        this.#asignarAutomaticamente();

        // Actualizar puntuación
        this.#actualizarPuntuacion();

        // Actualizar datos de servicios externos
        this.#actualizarDatosExternos();

        // Registrar snapshot de recursos al final del turno
        this.#registrarHistoricoRecursos();
    }

    #registrarHistoricoRecursos() {
        this.historicoRecursos.push({
            turno: this.turnoActual,
            dinero: this.recursos.dinero,
            electricidad: this.recursos.electricidad,
            agua: this.recursos.agua,
            alimentos: this.recursos.alimentos,
            comida: this.recursos.comida
        });

        if (this.historicoRecursos.length > 20) {
            this.historicoRecursos = this.historicoRecursos.slice(-20);
        }
    }

    /**
     * Gestiona el crecimiento poblacional
     */
    #gestionarCrecimientoPoblacional() {
        const felicidadPromedio = this.obtenerFelicidadPromedio();
        const capacidadVivienda = this.edificios
            .filter(e => e.tipo.startsWith('R'))
            .reduce((acc, e) => acc + (e.capacidadMaxima || 0), 0);

        const hogaresOcupados = this.edificios
            .filter(e => e.tipo.startsWith('R'))
            .reduce((acc, e) => acc + (e.ocupacionActual || 0), 0);

        const capacidadDisponible = Math.max(0, capacidadVivienda - hogaresOcupados);
        const empleosDisponibles = this.calcularEmpleosDisponibles();

        if (
            felicidadPromedio > 60 &&
            capacidadDisponible > 0 &&
            empleosDisponibles > 0
        ) {
            const rango = this.crecimiento.max - this.crecimiento.min + 1;
            const maxNuevos = Math.min(capacidadDisponible, empleosDisponibles);
            const nuevos = Math.min(
                maxNuevos,
                Math.floor(Math.random() * rango) + this.crecimiento.min
            );

            for (let i = 0; i < nuevos; i++) {
                const nextIndex = this.poblacion.length + i + 1;
                const nuevoCiudadano = new Ciudadano(
                    Date.now() + nextIndex,
                    `Ciudadano ${nextIndex}`,
                    `ciudadano${nextIndex}`,
                    `ciudadano${nextIndex}@ciudadvirtual.com`
                );
                this.poblacion.push(nuevoCiudadano);
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
        if (!this.datosClima) return 0;
        const condicion = this.datosClima.descripcion.toLowerCase();
        
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
        if (!this.datosClima) return 1.0;
        const condicion = this.datosClima.descripcion.toLowerCase();
        
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
        if (this.recursos.dinero > 0 && this.recursos.electricidad > 0 && this.recursos.agua > 0 && this.recursos.alimentos > 0) score += 200;
        if (this.poblacion.length > 1000) score += 1000;

        this.puntuacionAcumulada = score;
    }

    /**
     * Actualiza los datos locales de servicios externos
     */
    #actualizarDatosExternos() {
        // Actualizar clima - asignar instancia de Clima
        this.datosClima = this.servicioClima.obtenerDatosClimaActuales();

        // Actualizar noticias - asignar array de instancias de Noticia
        this.noticias = this.servicioNoticias.obtenerNoticiasActuales();
    }

    /**
     * Calcula la felicidad promedio de los ciudadanos
     */
    obtenerFelicidadPromedio() {
        if (this.poblacion.length === 0) return 0;
        return this.poblacion.reduce((a, b) => a + b.nivelFelicidad, 0) / this.poblacion.length;
    }

    verificarRecursosCriticos() {
        const electricidad = Number(this.recursos.electricidad ?? 0);
        const agua = Number(this.recursos.agua ?? 0);

        if (electricidad < 0 || agua < 0) {
            let motivo = 'Crisis de recursos: ';
            if (electricidad < 0 && agua < 0) motivo += 'Colapso total - Sin agua ni electricidad';
            else if (electricidad < 0) motivo += 'Energía negativa';
            else motivo += 'Balance de agua negativo';

            this.finalizarJuego(motivo);
            return true;
        }

        return false;
    }

    finalizarJuego(motivo) {
        if (this.juegoFinalizado) return;
        this.juegoFinalizado = true;
        this.motivoFinJuego = motivo;
        console.error(`GAME OVER: ${motivo}`);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('game-over', { detail: { motivo } }));
        }
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
            if (tipoRecurso === 'comida' || tipoRecurso === 'alimentos') return e.tipo === 'I2';
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
        const bonusServicios = this.edificios.filter(e =>
            ['P1', 'S1', 'S2', 'S3'].includes(e.tipo)
        ).length * 2; // 2 puntos por cada edificio de servicio/parque

        const efectoClima = this.#calcularAjusteFelicidadClima();
        const poblacionTotal = this.poblacion.length;
        const alimentosDisponibles = Number(this.recursos.alimentos ?? this.recursos.comida ?? 0);

        // Consumo indirecto de alimentos: impacta felicidad, no resta inventario directamente.
        let efectoAlimentos = 0;
        if (poblacionTotal > 0) {
            if (alimentosDisponibles >= poblacionTotal) {
                efectoAlimentos = 5;
            } else if (alimentosDisponibles >= Math.ceil(poblacionTotal * 0.5)) {
                efectoAlimentos = 1;
            } else {
                efectoAlimentos = -8;
            }
        }

        this.poblacion.forEach(ciudadano => {
            ciudadano.actualizarFelicidad();
            ciudadano.nivelFelicidad = Math.min(
                100,
                Math.max(0, ciudadano.nivelFelicidad + bonusServicios + efectoClima + efectoAlimentos)
            );
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
        let prodAlimentos = 0;
        granjas.forEach(granja => {
            if (granja.calcularProduccion) {
                prodAlimentos += granja.calcularProduccion();
            }
        });

        // Los alimentos son acumulables y generados por granjas.
        const multiplicadorClima = this.#calcularMultiplicadorProduccionComida();
        prodAlimentos *= multiplicadorClima;

        this.recursos.electricidad += prodElectricidad;
        this.recursos.agua += prodAgua;
        this.recursos.alimentos += prodAlimentos;
        this.recursos.comida = this.recursos.alimentos;
    }

    /**
     * Procesa consumo de recursos por propósito de edificio.
     * - Electricidad: la consumen todos excepto parques (P1) y utilidades (U1/U2).
     * - Agua: la consumen edificios urbanos según su configuración de tipo.
     * - Alimentos: consumo indirecto vía felicidad (no se resta aquí).
     */
    procesarConsumoRecursos() {
        let consumoElectricidad = 0;
        let consumoAgua = 0;

        this.edificios.forEach(edificio => {
            if (!edificio.estaOperativo) return;

            const tipo = edificio.tipo;
            if (tipo === 'U1' || tipo === 'U2') {
                return;
            }

            if (tipo !== 'P1') {
                consumoElectricidad += Math.max(0, Number(edificio.consumoElectricidad || 0));
            }

            consumoAgua += Math.max(0, Number(edificio.consumoAgua || 0));
        });

        // Restar consumo de recursos
        this.recursos.electricidad -= consumoElectricidad;
        this.recursos.agua -= consumoAgua;

        this.recursos.consumoElectricidadTurno = consumoElectricidad;
        this.recursos.consumoAguaTurno = consumoAgua;
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
            if (edificio.costoConstruccion) {
                const costoMantenimiento = Math.max(
                    1,
                    Math.round(edificio.costoConstruccion * 0.0001)
                );
                costosTotales += costoMantenimiento;
            }
        });

        this.vias.forEach(via => {
            if (via.costoConstruccion) {
                const costoVia = Math.max(
                    1,
                    Math.round(via.costoConstruccion * 0.0001)
                );
                costosTotales += costoVia;
            }
        });

        this.recursos.dinero -= costosTotales;
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
        const hogaresOcupados = this.edificios
            .filter(e => e.tipo.startsWith('R'))
            .reduce((acc, e) => acc + (e.ocupacionActual || 0), 0);
        return Math.max(0, this.getTotalHousingCapacity() - hogaresOcupados);
    }

    getAvailableJobs() {
        const employed = this.poblacion.filter(c => c.estadoEmpleo).length;
        return Math.max(0, this.getTotalJobs() - employed);
    }

    /**
     * Serializa la ciudad a un objeto simple (JSON). Adecuado para guardado.
     */
    toJSON() {
        const edificiosSerializados = this.edificios
            .map((edificio, index) => {
                if (edificio && typeof edificio.obtenerEstado === 'function') {
                    return edificio.obtenerEstado();
                }

                // Compatibilidad con estados antiguos/objetos planos para no perder guardado.
                if (edificio && typeof edificio === 'object') {
                    return {
                        id: edificio.id || `legacy-${index}`,
                        tipo: edificio.tipo || 'R1',
                        ubicacion: {
                            x: Number(edificio.x ?? edificio.ubicacion?.x ?? 0),
                            y: Number(edificio.y ?? edificio.ubicacion?.y ?? 0)
                        },
                        ocupacionActual: Number(edificio.ocupacionActual || 0),
                        capacidadMaxima: Number(edificio.capacidadMaxima || 0),
                        estaOperativo: edificio.estaOperativo !== false
                    };
                }

                return null;
            })
            .filter(Boolean);

        const poblacionSerializada = this.poblacion
            .map((ciudadano, index) => {
                if (ciudadano && typeof ciudadano.obtenerEstado === 'function') {
                    return ciudadano.obtenerEstado();
                }

                if (ciudadano && typeof ciudadano === 'object') {
                    return {
                        id: ciudadano.id || `legacy-citizen-${index}`,
                        name: ciudadano.name || '',
                        username: ciudadano.username || '',
                        email: ciudadano.email || '',
                        nivelFelicidad: Number(ciudadano.nivelFelicidad || 0),
                        estadoVivienda: Boolean(ciudadano.estadoVivienda),
                        estadoEmpleo: Boolean(ciudadano.estadoEmpleo)
                    };
                }
                return null;
            })
            .filter(Boolean);

        return {
            cityId: this.cityId,
            nombre: this.nombre,
            alcalde: this.alcalde ? this.alcalde.nombre : null,
            region: this.region,
            ancho: this.ancho,
            alto: this.alto,
            turnoActual: this.turnoActual,
            puntuacionAcumulada: this.puntuacionAcumulada,
            edificios: edificiosSerializados,
            vias: this.vias.slice(),
            poblacion: poblacionSerializada,
            recursos: { ...this.recursos },
            historicoRecursos: this.historicoRecursos.slice(-20),
            crecimiento: { ...this.crecimiento },
            juegoFinalizado: Boolean(this.juegoFinalizado),
            motivoFinJuego: this.motivoFinJuego || null,
            turnosConDeficit: this.turnosConDeficit || 0,
            mapa: this.mapa.exportarMapa()
        };
    }

    /**
     * Reconstruye una ciudad a partir de un objeto creado por toJSON.
     * Nota: las edificaciones devueltas serán objetos planos, no instancias.
     */
    static fromJSON(data) {
        const ancho = data.ancho || data.gridSize?.width || data.mapa?.dimensiones?.ancho || 20;
        const alto = data.alto || data.gridSize?.height || data.mapa?.dimensiones?.alto || 20;
        const nombre = data.nombre || data.cityName || 'Nueva Ciudad';
        const alcalde = data.alcalde || data.mayor || 'Alcalde';
        const region = normalizarRegion(data.region || {
            nombre: 'Región desconocida',
            coordenadas: data.coordinates || { lat: 0, lon: 0 }
        });

        const c = new Ciudad(nombre, alcalde, region, ancho, alto);
        c.cityId = data.cityId || generarIdCiudad(nombre);
        c.turnoActual = data.turnoActual || 0;
        c.puntuacionAcumulada = data.puntuacionAcumulada || 0;

        // Restaurar mapa (grid) aceptando formatos antiguos y nuevos.
        const mapaGuardado = Array.isArray(data.mapa)
            ? data.mapa
            : (Array.isArray(data.mapa?.grid) ? data.mapa.grid : null);

        if (Array.isArray(mapaGuardado) && mapaGuardado.length > 0) {
            for (let y = 0; y < Math.min(c.alto, mapaGuardado.length); y++) {
                for (let x = 0; x < Math.min(c.ancho, mapaGuardado[y].length); x++) {
                    c.mapa.grid[y][x] = mapaGuardado[y][x];
                }
            }
        }

        // Reconstruir instancias de edificios desde el estado serializado
        c.edificios = (data.edificios || []).map(reconstruirEdificioDesdeEstado).filter(e => e !== null);
        c.vias = data.vias || data.roads || [];
        c.poblacion = (data.poblacion || []).map(item => {
            if (!item || item.id == null) return null;
            const ciudadano = new Ciudadano(
                item.id,
                item.name || item.nombre || '',
                item.username || '',
                item.email || ''
            );
            ciudadano.nivelFelicidad = Number(item.nivelFelicidad ?? 50);
            ciudadano.estadoVivienda = Boolean(item.estadoVivienda);
            ciudadano.estadoEmpleo = Boolean(item.estadoEmpleo);
            return ciudadano;
        }).filter(Boolean);
        c.recursos = data.recursos || c.recursos;
        c.recursos.dinero = Number(c.recursos.dinero ?? 0);
        c.recursos.electricidad = Number(c.recursos.electricidad ?? 0);
        c.recursos.agua = Number(c.recursos.agua ?? 0);
        c.recursos.alimentos = Number(c.recursos.alimentos ?? c.recursos.comida ?? 0);
        c.recursos.comida = c.recursos.alimentos;
        c.historicoRecursos = (data.historicoRecursos || []).slice(-20);
        c.crecimiento = data.crecimiento || c.crecimiento;
        c.juegoFinalizado = Boolean(data.juegoFinalizado);
        c.motivoFinJuego = data.motivoFinJuego || null;
        c.turnosConDeficit = Number(data.turnosConDeficit || 0);

        // Si el mapa vino vacío o incompleto, reconstruirlo desde vías y edificios.
        const mapaVacio = !Array.isArray(c.mapa.grid)
            || c.mapa.grid.length === 0
            || !Array.isArray(c.mapa.grid[0]);

        if (mapaVacio) {
            c.mapa = new Mapa(c.ancho, c.alto);
        }

        const normalizarCelda = (x, y, tipo) => {
            if (c.mapa.esCoordenadaValida(x, y)) {
                c.mapa.grid[y][x] = tipo;
            }
        };

        c.vias.forEach((via) => normalizarCelda(Number(via.x), Number(via.y), 'r'));
        c.edificios.forEach((ed) => normalizarCelda(Number(ed.x), Number(ed.y), ed.tipo));

        if (!Array.isArray(c.historicoRecursos) || c.historicoRecursos.length === 0) {
            c.historicoRecursos = [{
                turno: c.turnoActual,
                dinero: c.recursos.dinero,
                electricidad: c.recursos.electricidad,
                agua: c.recursos.agua,
                alimentos: c.recursos.alimentos,
                comida: c.recursos.comida
            }];
        }

        return c;
    }

    /**
     * Obtiene el estado general de la ciudad
     */
    obtenerEstadoGeneral() {
        if (!this.juegoFinalizado) {
            this.verificarRecursosCriticos();
        }
        return {
            cityId: this.cityId,
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
                parques: this.edificios.filter(e => e.tipo === 'P1').length,
                lista: this.edificios.map(e => ({
                    id: e.id,
                    tipo: e.tipo,
                    x: e.x,
                    y: e.y
                }))
            },
            recursos: {
                dinero: this.recursos.dinero,
                electricidad: this.recursos.electricidad,
                agua: this.recursos.agua,
                alimentos: this.recursos.alimentos,
                comida: this.recursos.comida
            },
            juegoFinalizado: Boolean(this.juegoFinalizado),
            motivoFinJuego: this.motivoFinJuego || null,
            clima: this.datosClima ? { ...this.datosClima } : null,
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

