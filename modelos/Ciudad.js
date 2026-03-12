
import { Mapa } from './Mapa.js';
import { Alcalde } from './Alcalde.js';

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
     * Valida si se puede construir en una ubicación
     */
    puedeConstruir(x, y, costo) {
        if (this.recursos.dinero < costo) return false;
        
        const vecinos = this.mapa.obtenerVecinos(x, y);
        const tieneViaAdyacente = vecinos.some(([vx, vy]) => this.mapa.obtenerCelda(vx, vy) === 'r');
        
        return tieneViaAdyacente && this.mapa.estaDisponible(x, y);
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
        this.#gestionarCrecimientoPoblacional();
        // Asignaciones automáticas tras la creación de nuevos residentes
        this.#asignarAutomaticamente();

        // Actualizar puntuación
        this.#actualizarPuntuacion();
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
     * Calcula la puntuación actual
     */
    #actualizarPuntuacion() {
        const felicidad = this.obtenerFelicidadPromedio();
        const numEdificios = this.edificios.length;
        
        let score = (this.poblacion.length * 10) + 
                    (felicidad * 5) + 
                    (this.recursos.dinero / 100) + 
                    (numEdificios * 50);

        const desempleados = this.poblacion.filter(c => !c.estadoEmpleo).length;
        score -= (desempleados * 10);

        this.puntuacionAcumulada = score;
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

        this.poblacion.forEach(ciudadano => {
            const consumoTurno = {
                agua: this.recursos.agua > 0 ? 0 : 5,
                electricidad: this.recursos.electricidad > 0 ? 0 : 5,
                comida: this.recursos.comida > 0 ? 0 : 5
            };

            ciudadano.actualizarConsumos(
                consumoTurno.agua,
                consumoTurno.electricidad,
                consumoTurno.comida
            );

            ciudadano.actualizarFelicidad();

            // aplicar adicional de servicios
            ciudadano.nivelFelicidad = Math.min(100, ciudadano.nivelFelicidad + bonusServicios);
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

        const fabricas = this.edificios.filter(e => e.tipo.startsWith('I') && e.estaOperativo);
        let prodComida = 0;
        fabricas.forEach(fabrica => {
            if (fabrica.calcularProduccion) {
                prodComida += fabrica.calcularProduccion();
            }
        });

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
     * Procesa ingresos de comercios y residenciales
     */
    procesarIngresos() {
        let ingresosTotales = 0;

        const comercios = this.edificios.filter(e => e.tipo.startsWith('C'));
        comercios.forEach(comercio => {
            if (comercio.estaOperativo && comercio.calcularIngresos) {
                ingresosTotales += comercio.calcularIngresos();
            }
        });

        const residenciales = this.edificios.filter(e => e.tipo.startsWith('R'));
        residenciales.forEach(residencial => {
            if (residencial.estaOperativo && residencial.calcularIngresos) {
                ingresosTotales += residencial.calcularIngresos();
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
            mapa: this.mapa.obtenerEstadisticasMapa()
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

// exportar para uso externo
export { Ciudad };