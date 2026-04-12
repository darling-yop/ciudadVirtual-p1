/**
 * SistemaTurnos.js
 * Clase que gestiona el sistema de turnos del juego de simulación urbana.
 * Ejecuta las 6 acciones secuenciales por cada turno según la documentación.
 */
import { RankingLocal } from '../acceso_datos/RankingLocal.js';

class SistemaTurnos {
    constructor(ciudad, duracionTurnoSegundos = 10) {
        // Referencia a la ciudad que gestiona
        this.ciudad = ciudad;

        // Sistema de ranking
        this.rankingLocal = new RankingLocal();

        // Configuración del turno
        this.duracionTurno = duracionTurnoSegundos * 1000; // Convertir a milisegundos
        this.enEjecucion = false;
        this.intervalID = null;

        // Estadísticas del sistema
        this.turnosEjecutados = 0;
        this.ultimoTurno = new Date();
    }

    /**
     * Inicia el sistema de turnos automáticos
     */
    iniciar() {
        if (this.enEjecucion) {
            console.log('El sistema de turnos ya está en ejecución');
            return;
        }

        console.log(`Iniciando sistema de turnos cada ${this.duracionTurno / 1000} segundos`);
        this.enEjecucion = true;

        this.intervalID = setInterval(() => {
            this.ejecutarTurno();
        }, this.duracionTurno);
    }

    /**
     * Pausa el sistema de turnos
     */
    pausar() {
        if (!this.enEjecucion) {
            console.log('El sistema de turnos ya está pausado');
            return;
        }

        console.log('Pausando sistema de turnos');
        this.enEjecucion = false;
        clearInterval(this.intervalID);
        this.intervalID = null;
    }

    /**
     * Reanuda el sistema de turnos
     */
    reanudar() {
        if (this.enEjecucion) {
            console.log('El sistema de turnos ya está en ejecución');
            return;
        }

        console.log('Reanudando sistema de turnos');
        this.iniciar();
    }

    /**
     * Detiene completamente el sistema de turnos
     */
    detener() {
        this.pausar();
        console.log('Sistema de turnos detenido');
    }

    /**
     * Ejecuta manualmente un turno (útil para pruebas o control manual)
     */
    ejecutarTurnoManual() {
        if (this.enEjecucion) {
            console.log('No se puede ejecutar turno manual mientras el sistema automático está activo');
            return false;
        }

        this.ejecutarTurno();
        return true;
    }

    /**
     * Ejecuta todas las acciones del turno en orden secuencial
     * Según la documentación: 6 acciones por turno
     */
    ejecutarTurno() {
        console.log(`Ejecutando turno ${this.ciudad.turnoActual + 1}`);

        try {
            // 1. Calcular producción de recursos
            this.calcularProduccionRecursos();

            // 2. Calcular consumo de recursos
            this.calcularConsumoRecursos();

            // 3. Aplicar costos de mantenimiento
            this.aplicarCostosMantenimiento();

            // 4. Actualizar felicidad de ciudadanos
            this.actualizarFelicidadCiudadanos();

            // 5. Actualizar puntuación
            this.actualizarPuntuacion();

            // 6. Guardar estado en localStorage
            this.guardarEnLocalStorage();

            // 7. Actualizar ranking local
            this.rankingLocal.guardarPuntuacion(this.ciudad);

            // Incrementar contador de turnos
            this.ciudad.turnoActual++;
            this.turnosEjecutados++;
            this.ultimoTurno = new Date();

            console.log(`Turno ${this.ciudad.turnoActual} completado exitosamente`);

        } catch (error) {
            console.error('Error durante la ejecución del turno:', error);
            // En caso de error, pausar el sistema para evitar bucles infinitos
            this.pausar();
        }
    }

    /**
     * 1. CALCULAR PRODUCCIÓN DE RECURSOS
     * Suma la producción de todos los edificios productores
     */
    calcularProduccionRecursos() {
        let produccionEnergia = 0;
        let produccionAgua = 0;
        let produccionComida = 0;

        // Recorrer todos los edificios para calcular producción
        this.ciudad.edificios.forEach(edificio => {
            if (edificio.estaOperativo) {
                switch (edificio.tipo) {
                    case 'P1': // Planta de energía
                        produccionEnergia += edificio.produccionRecurso;
                        break;
                    case 'U1': // Planta de agua
                    case 'U2':
                        produccionAgua += edificio.produccionRecurso;
                        break;
                    case 'F1': // Granja
                        produccionComida += edificio.produccionRecurso;
                        break;
                }
            }
        });

        // Actualizar recursos de la ciudad
        this.ciudad.recursos.produccionEnergia = produccionEnergia;
        this.ciudad.recursos.produccionAgua = produccionAgua;
        this.ciudad.recursos.produccionComida = produccionComida;

        console.log(`Producción calculada - Energía: ${produccionEnergia}, Agua: ${produccionAgua}, Comida: ${produccionComida}`);
    }

    /**
     * 2. CALCULAR CONSUMO DE RECURSOS
     * Suma el consumo de ciudadanos y edificios
     */
    calcularConsumoRecursos() {
        let consumoEnergia = 0;
        let consumoAgua = 0;
        let consumoComida = 0;

        // Consumo de ciudadanos
        this.ciudad.poblacion.forEach(ciudadano => {
            consumoAgua += ciudadano.consumoAgua;
            consumoEnergia += ciudadano.consumoElectricidad;
            consumoComida += ciudadano.consumoComida;
        });

        // Consumo de edificios (excepto parques que no consumen energía)
        this.ciudad.edificios.forEach(edificio => {
            if (edificio.estaOperativo && edificio.tipo !== 'S1' && edificio.tipo !== 'S2' && edificio.tipo !== 'S3') {
                consumoEnergia += edificio.consumoElectricidad;
                consumoAgua += edificio.consumoAgua;
            }
        });

        // Actualizar recursos de la ciudad
        this.ciudad.recursos.consumoEnergia = consumoEnergia;
        this.ciudad.recursos.consumoAgua = consumoAgua;

        // Aplicar consumo de comida (se resta directamente)
        this.ciudad.recursos.alimentos -= consumoComida;
        if (this.ciudad.recursos.alimentos < 0) {
            this.ciudad.recursos.alimentos = 0; // No puede ser negativo
        }

        console.log(`Consumo calculado - Energía: ${consumoEnergia}, Agua: ${consumoAgua}, Comida: ${consumoComida}`);
    }

    /**
     * 3. APLICAR COSTOS DE MANTENIMIENTO
     * Cada edificio tiene un costo de mantenimiento por turno
     */
    aplicarCostosMantenimiento() {
        let costoTotalMantenimiento = 0;

        this.ciudad.edificios.forEach(edificio => {
            if (edificio.estaOperativo) {
                // Costo de mantenimiento aproximado (10% del costo de construcción)
                const costoMantenimiento = Math.floor(edificio.costoConstruccion * 0.1);
                costoTotalMantenimiento += costoMantenimiento;

                // Verificar si hay suficiente dinero
                if (this.ciudad.recursos.dinero >= costoMantenimiento) {
                    this.ciudad.recursos.dinero -= costoMantenimiento;
                } else {
                    // Si no hay dinero suficiente, el edificio deja de operar
                    edificio.estaOperativo = false;
                    console.log(`Edificio ${edificio.id} (${edificio.tipo}) dejó de operar por falta de fondos de mantenimiento`);
                }
            }
        });

        console.log(`Costos de mantenimiento aplicados: $${costoTotalMantenimiento}`);
    }

    /**
     * 4. ACTUALIZAR FELICIDAD DE CIUDADANOS
     * Basado en vivienda, empleo y recursos disponibles
     */
    actualizarFelicidadCiudadanos() {
        this.ciudad.poblacion.forEach(ciudadano => {
            ciudadano.actualizarFelicidad();

            // Verificar si la felicidad es demasiado baja (riesgo de emigración)
            if (ciudadano.nivelFelicidad < 20) {
                console.log(`Ciudadano ${ciudadano.name} tiene felicidad muy baja (${ciudadano.nivelFelicidad})`);
            }
        });

        // Calcular felicidad promedio de la ciudad
        const felicidadPromedio = this.ciudad.poblacion.length > 0
            ? this.ciudad.poblacion.reduce((sum, c) => sum + c.nivelFelicidad, 0) / this.ciudad.poblacion.length
            : 0;

        console.log(`Felicidad promedio de ciudadanos: ${felicidadPromedio.toFixed(1)}`);
    }

    /**
     * 5. ACTUALIZAR PUNTUACIÓN
     * Basado en felicidad, recursos y desarrollo urbano
     */
    actualizarPuntuacion() {
        let puntuacionTurno = 0;

        // Puntuación por felicidad de ciudadanos (0-50 puntos)
        const felicidadPromedio = this.ciudad.poblacion.length > 0
            ? this.ciudad.poblacion.reduce((sum, c) => sum + c.nivelFelicidad, 0) / this.ciudad.poblacion.length
            : 0;
        puntuacionTurno += Math.floor(felicidadPromedio / 2);

        // Puntuación por recursos acumulados (0-30 puntos)
        const recursosBonus = Math.min(30, Math.floor(
            (this.ciudad.recursos.dinero / 10000) +
            (this.ciudad.recursos.alimentos / 100) +
            (this.ciudad.recursos.obtenerBalanceNetoEnergia() / 10) +
            (this.ciudad.recursos.obtenerBalanceNetoAgua() / 10)
        ));
        puntuacionTurno += recursosBonus;

        // Puntuación por desarrollo urbano (0-20 puntos)
        const desarrolloBonus = Math.min(20, this.ciudad.edificios.filter(e => e.estaOperativo).length * 2);
        puntuacionTurno += desarrolloBonus;

        // Actualizar puntuación acumulada
        this.ciudad.puntuacionAcumulada += puntuacionTurno;

        // Actualizar experiencia del alcalde
        if (this.ciudad.alcalde) {
            this.ciudad.alcalde.calcularExperienciaTurno();
        }

        console.log(`Puntuación del turno: ${puntuacionTurno} (Total acumulado: ${this.ciudad.puntuacionAcumulada})`);
    }

    /**
     * 6. GUARDAR ESTADO EN LOCALSTORAGE
     * Persistir el estado completo de la ciudad
     */
    guardarEnLocalStorage() {
        try {
            const estadoCiudad = {
                nombre: this.ciudad.nombre,
                alcalde: {
                    nombre: this.ciudad.alcalde.nombre,
                    nivel: this.ciudad.alcalde.nivel,
                    experiencia: this.ciudad.alcalde.experiencia,
                    puntuacion: this.ciudad.alcalde.puntuacion
                },
                turnoActual: this.ciudad.turnoActual,
                puntuacionAcumulada: this.ciudad.puntuacionAcumulada,
                recursos: this.ciudad.recursos,
                poblacion: this.ciudad.poblacion.length,
                edificios: this.ciudad.edificios.length,
                fechaGuardado: new Date().toISOString()
            };

            localStorage.setItem('ciudadVirtual_estado', JSON.stringify(estadoCiudad));
            console.log('Estado guardado en localStorage');

        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
        }
    }

    /**
     * Carga el estado desde localStorage
     */
    cargarDesdeLocalStorage() {
        try {
            const estadoGuardado = localStorage.getItem('ciudadVirtual_estado');
            if (estadoGuardado) {
                const estado = JSON.parse(estadoGuardado);
                console.log('Estado cargado desde localStorage:', estado.fechaGuardado);
                return estado;
            }
        } catch (error) {
            console.error('Error al cargar desde localStorage:', error);
        }
        return null;
    }

    /**
     * Obtiene estadísticas del sistema de turnos
     */
    obtenerEstadisticas() {
        return {
            turnosEjecutados: this.turnosEjecutados,
            ultimoTurno: this.ultimoTurno,
            enEjecucion: this.enEjecucion,
            duracionTurnoSegundos: this.duracionTurno / 1000,
            turnoActualCiudad: this.ciudad.turnoActual
        };
    }

    /**
     * Configura la duración del turno
     */
    configurarDuracionTurno(segundos) {
        const nuevaDuracion = Math.max(1, Math.min(300, segundos)); // Entre 1 y 300 segundos

        if (this.enEjecucion) {
            this.pausar();
            this.duracionTurno = nuevaDuracion * 1000;
            this.iniciar();
        } else {
            this.duracionTurno = nuevaDuracion * 1000;
        }

        console.log(`Duración del turno configurada a ${nuevaDuracion} segundos`);
    }
}

export { SistemaTurnos };
