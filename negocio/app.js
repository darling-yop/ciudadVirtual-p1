import { CityRepository } from '../acceso_datos/CityRepository.js';
import { RankingLocal } from '../acceso_datos/RankingLocal.js';
import { Ciudad } from '../modelos/Ciudad.js';
import { CityManager } from './CityManager.js';
import { ViewController } from './viewController.js';

const BUILDING_TYPE_LABELS = {
    r: 'Vía',
    R1: 'Residencial R1',
    R2: 'Residencial R2',
    C1: 'Comercial C1',
    C2: 'Comercial C2',
    I1: 'Industrial I1',
    I2: 'Industrial I2',
    U1: 'Utilidad U1',
    U2: 'Utilidad U2',
    S1: 'Servicio S1',
    S2: 'Servicio S2',
    S3: 'Servicio S3',
    P1: 'Parque P1'
};

// Inicializar la aplicación
class App {
    constructor() {
        this.manager = CityManager.getInstance();
        this.ranking = new RankingLocal();
        this.selectedCell = null;
        this.selectedTipo = 'r';
        this.serviciosIniciados = false;
        this.turnosDesdeUltimaActualizacionRanking = 0;
        this.TURNOS_POR_ACTUALIZACION_RANKING = 5; // Actualizar ranking cada 5 turnos

        this.view = new ViewController({
            onCellSelected: ({ x, y, tipo }) => {
                this.selectedCell = { x, y, tipo };
                this.actualizarUI();
            },
            onConstruir: (cell, tipo) => {
                const targetCell = cell || this.selectedCell || this.view.selectedCell;
                const effectiveTipo = tipo || this.selectedTipo || this.view.selectedTipo;

                if (!targetCell) {
                    this.view.showToast('Selecciona una celda en el mapa antes de construir.', { tipo: 'warning' });
                    console.error('Construir: no hay celda seleccionada', { cell, selectedCellApp: this.selectedCell, selectedCellView: this.view.selectedCell, tipo });
                    return;
                }

                if (!effectiveTipo) {
                    this.view.showToast('Selecciona un tipo de construcción (R1, C1, I1, r, etc.).', { tipo: 'warning' });
                    console.error('Construir: no hay tipo seleccionado', { tipo, selectedTipoApp: this.selectedTipo, selectedTipoView: this.view.selectedTipo });
                    return;
                }

                const resultado = this.manager.construir(effectiveTipo, targetCell.x, targetCell.y);

                if (!resultado.exito) {
                    this.view.showToast(`No se construyó: ${resultado.mensaje}`, { tipo: 'error' });
                    console.warn('Construir fallido', resultado, { targetCell, effectiveTipo });
                } else {
                    const tipoDescripcion = BUILDING_TYPE_LABELS[effectiveTipo] || `Tipo ${effectiveTipo}`;
                    this.view.showToast(`Construcción de ${tipoDescripcion} realizada en (${targetCell.x}, ${targetCell.y}).`, { tipo: 'success' });
                    console.log(`Construcción OK: ${effectiveTipo}@(${targetCell.x},${targetCell.y})`);
                }

                this.view.limpiarRuta();
                this.view.setEstadoRuta('Ruta limpiada por cambio en el mapa.');
                this.actualizarUI();
            },
            onDemoler: (cell) => {
                if (!cell) {
                    alert('Primero selecciona una celda en el mapa antes de demoler.');
                    return;
                }

                // Obtener info del edificio antes de confirmar
                const edificio = this.manager.ciudad?.obtenerEdificioPorCoordenadas(cell.x, cell.y);
                let mensajeConfirmacion = '¿Demoler este edificio?';

                if (edificio) {
                    const reembolso = edificio.reembolsoDemolicion || 0;
                    const ocupacion = edificio.ocupacionActual || 0;
                    const esResidencial = edificio.tipo.startsWith('R');
                    const tipoTexto = esResidencial ? 'vivienda' : 'empleo';

                    mensajeConfirmacion = `¿Demoler ${edificio.tipo} en (${cell.x}, ${cell.y})?\n\n`;
                    mensajeConfirmacion += `💰 Reembolso: $${reembolso.toLocaleString()} (50% del costo)\n`;
                    if (ocupacion > 0) {
                        mensajeConfirmacion += `⚠️ ${ocupacion} ciudadano${ocupacion > 1 ? 's' : ''} perder${ocupacion > 1 ? 'án' : 'á'} su ${tipoTexto}.`;
                    }
                }

                const confirmar = window.confirm(mensajeConfirmacion);
                if (!confirmar) return;

                const resultado = this.manager.demoler(cell.x, cell.y);
                if (!resultado.exito) {
                    this.view.showToast(`No se demolió: ${resultado.mensaje}`, { tipo: 'error' });
                } else {
                    let mensaje = `Demolición OK. Reembolso: $${resultado.reembolso.toLocaleString()}`;
                    if (resultado.ciudadanosAfectados > 0) {
                        mensaje += ` | ${resultado.ciudadanosAfectados} ciudadano${resultado.ciudadanosAfectados > 1 ? 's' : ''} afectado${resultado.ciudadanosAfectados > 1 ? 's' : ''}.`;
                    }
                    this.view.showToast(mensaje, { tipo: 'success' });
                }

                this.view.limpiarRuta();
                this.actualizarUI();
            },
            onProcesarTurno: () => this.procesarTurno(),
            onIniciarServicios: () => this.iniciarServiciosExternos(),
            onVerRanking: () => this.abrirPaginaRanking(),
            onIniciarTurnos: () => {
                this.manager.iniciarCicloTurnos(() => this.actualizarUI());
                this.view.el.botonIniciarTurnos.disabled = true;
                this.view.el.botonDetenerTurnos.disabled = false;
            },
            onDetenerTurnos: () => {
                this.manager.detenerCicloTurnos();
                this.view.el.botonIniciarTurnos.disabled = false;
                this.view.el.botonDetenerTurnos.disabled = true;
            },
            onCalcularRuta: async (idOrigen, idDestino) => {
                await this.calcularRuta(idOrigen, idDestino);
            },
            onExportar: () => this.exportarCiudad(),
            onGuardar: () => this.manager.save(),
            onEliminarPartida: (cityId) => this.eliminarPartida(cityId),
            onContinuarPartida: (cityId) => this.continuarPartidaGuardada(cityId),
            onNuevaPartida: () => this.iniciarNuevaPartidaDesdeCero(),
            onAbrirSelectorCiudades: () => this.mostrarSelectorCiudades(),
            onAplicarRecursos: (recursos) => this.aplicarRecursosManuales(recursos),
            onCancelar: () => {
                this.selectedCell = null;
                this.actualizarUI();
            },
            onCrearCiudad: (data) => this.crearNuevaCiudad(data)
        });

        window.addEventListener('city-save-status', (event) => {
            const { status } = event.detail || {};
            if (status === 'saving') {
                this.view.setSaveStatus('Guardando...', 'saving');
            } else if (status === 'error') {
                this.view.setSaveStatus('Error al guardar', 'error');
            } else {
                this.view.setSaveStatus('Guardado', 'ok');
            }
        });

        window.addEventListener('city-external-services-updated', () => {
            this.actualizarUI();
        });

        window.addEventListener('demoler-edificio', (event) => {
            const { x, y } = event.detail || {};
            if (x === undefined || y === undefined) return;
            
            const confirmar = window.confirm('¿Seguro que deseas demoler este edificio?');
            if (!confirmar) return;

            const resultado = this.manager.demoler(x, y);
            if (!resultado.exito) {
                this.view.showToast(`No se demolió: ${resultado.mensaje}`, { tipo: 'error' });
            } else {
                const mensaje = resultado.reembolso > 0 
                    ? `Demolición OK. Reembolso: $${resultado.reembolso}`
                    : 'Demolición completada';
                this.view.showToast(mensaje, { tipo: 'success' });
            }
            
            this.selectedCell = null;
            this.actualizarUI();
        });

        if (CityRepository.hasSaves()) {
            this.mostrarSelectorCiudades();
        } else {
            this.view.showNewCityModal();
        }
    }

    mostrarSelectorCiudades() {
        const partidas = CityRepository.listSaves();
        if (partidas.length === 0) {
            this.view.hideContinueGameModal();
            this.view.showNewCityModal();
            return;
        }

        this.view.renderSavedCities(partidas, CityRepository.getActiveSaveId());
        this.view.showContinueGameModal();
    }

    async continuarPartidaGuardada(cityId = null) {
        await this.manager.init(cityId);
        this.manager.iniciarAutoGuardado();
        this.actualizarUI();
        this.view.hideContinueGameModal();
    }

    iniciarNuevaPartidaDesdeCero() {
        this.view.hideContinueGameModal();
        this.view.showNewCityModal();
    }

    eliminarPartida(cityId = null) {
        const targetCityId = cityId || CityRepository.getActiveSaveId();
        if (!targetCityId) {
            this.view.showNewCityModal();
            return;
        }

        const confirmar = window.confirm('¿Seguro que deseas eliminar la partida guardada? Esta acción no se puede deshacer.');
        if (!confirmar) return;

        const esCiudadActiva = this.manager.ciudad?.cityId === targetCityId;
        const restantes = CityRepository.deleteSave(targetCityId);

        if (esCiudadActiva) {
            this.manager.detenerAutoGuardado();
            this.manager.ciudad = null;
        }

        this.view.limpiarRuta();

        if (restantes.length > 0) {
            this.view.setSaveStatus('Partida eliminada', 'ok');
            this.mostrarSelectorCiudades();
            return;
        }

        this.view.hideContinueGameModal();
        this.view.showNewCityModal();
        this.view.setSaveStatus('Sin partidas guardadas', 'ok');
    }

    crearNuevaCiudad({ nombre, alcalde, region, tamano, mapaTexto }) {
        // Crear ciudad en manager y guardarla
        this.manager.ciudad = new Ciudad(nombre, alcalde, region, tamano, tamano);

        // Si se cargó un mapa desde archivo, aplicarlo
        if (mapaTexto) {
            const resultado = this.manager.ciudad.cargarMapaDesdeTexto(mapaTexto);
            if (!resultado.exito) {
                alert(`No se pudo cargar el mapa: ${resultado.mensaje}`);
            }
        }

        this.manager.activeCityId = this.manager.ciudad.cityId;
        this.manager.save();
        this.manager.iniciarAutoGuardado();
        this.actualizarUI();
    }

    iniciarServiciosExternos() {
        if (!this.serviciosIniciados) {
            const ciudad = this.manager.ciudad;
            if (ciudad) {
                try {
                    ciudad.iniciarServiciosExternos();
                    this.serviciosIniciados = true;
                    
                    // Proporcionar feedback visual
                    const boton = document.getElementById('iniciar-servicios');
                    if (boton) {
                        boton.disabled = true;
                        boton.textContent = 'Servicios Iniciados ✓';
                    }
                    
                    console.log('Servicios externos iniciados (Clima y Noticias activos)');
                    alert('Servicios externos iniciados correctamente.\nEl clima y las noticias se actualizarán cada 30 minutos.');
                } catch (error) {
                    console.error('Error al iniciar servicios externos:', error);
                    alert('Error al iniciar servicios externos. Revisar consola.');
                }
            } else {
                alert('No hay ciudad cargada. Crea una ciudad primero.');
            }
        } else {
            alert('Los servicios exteriores ya están iniciados.');
        }
    }

    abrirPaginaRanking() {
        console.log('📊 Abriendo página de ranking...');
        // Guardar estado actual de la ciudad antes de ir a ranking
        if (this.manager.ciudad) {
            console.log('💾 Guardando puntuación de ciudad actual:', this.manager.ciudad.nombre);
            this.ranking.guardarPuntuacion(this.manager.ciudad);
        } else {
            console.warn('⚠️ No hay ciudad activa para guardar en ranking');
        }
        // Abrir página de ranking
        console.log('🔗 Navegando a ranking.html');
        window.location.href = './ranking.html';
    }

    procesarTurno() {
        try {
            if (!this.manager.ciudad) {
                alert('No hay ciudad cargada. Crea una nueva ciudad primero.');
                return;
            }

            const turnoAnterior = this.manager.ciudad.turnoActual;
            this.manager.procesarTurno();
            const turnoNuevo = this.manager.ciudad.turnoActual;

            // Log de información del turno
            console.log(`Turno procesado: ${turnoAnterior} → ${turnoNuevo}`);
            
            // Actualizar UI completamente
            this.view.limpiarRuta();
            this.view.setEstadoRuta('Turno procesado. Selecciona edificios para calcular una ruta.');
            this.actualizarUI();
            
            const estado = this.manager.obtenerEstado();
            if (estado && estado.juegoFinalizado) {
                this.view.showToast(`Juego finalizado: ${estado.motivoFinJuego || 'Recursos negativos detectados'}`, { tipo: 'error', durationMs: 6000 });
                // Guardar en ranking cuando finaliza el juego
                this.ranking.guardarPuntuacion(this.manager.ciudad);
                console.log('Ciudad guardada en ranking');
            }

            // Actualizar ranking periódicamente (cada X turnos)
            this.turnosDesdeUltimaActualizacionRanking++;
            if (this.turnosDesdeUltimaActualizacionRanking >= this.TURNOS_POR_ACTUALIZACION_RANKING) {
                this.ranking.guardarPuntuacion(this.manager.ciudad);
                this.turnosDesdeUltimaActualizacionRanking = 0;
            }

            // Feedback visual
            if (estado) {
                console.log(`Dinero: ${estado.recursos.dinero} | Electricidad: ${estado.recursos.electricidad} | Agua: ${estado.recursos.agua}`);
            }
        } catch (error) {
            console.error('Error al procesar turno:', error);
            alert('Error al procesar el turno. Revisar consola.');
        }
    }

    async calcularRuta(idEdificioOrigen, idEdificioDestino) {
        if (!idEdificioOrigen || !idEdificioDestino) {
            this.view.setEstadoRuta('Debes seleccionar edificio origen y destino.', true);
            return;
        }

        const resultado = await this.manager.planificarRuta(idEdificioOrigen, idEdificioDestino);

        if (!resultado.exito) {
            this.view.limpiarRuta();
            this.view.setEstadoRuta(resultado.error || 'No fue posible calcular la ruta.', true);
            return;
        }

        await this.view.animarRuta(resultado.ruta);
        this.view.setEstadoRuta(`Ruta encontrada. Distancia: ${resultado.ruta.length - 1} celdas.`);
    }

    aplicarRecursosManuales(recursos = {}) {
        if (!this.manager.ciudad) {
            this.view.showToast('No hay ciudad cargada para ajustar recursos.', { tipo: 'warning' });
            return;
        }

        const electricidad = Number(recursos.electricidad ?? 0);
        const agua = Number(recursos.agua ?? 0);
        const alimentos = Number(recursos.alimentos ?? 0);

        if ([electricidad, agua, alimentos].some((v) => Number.isNaN(v))) {
            this.view.showToast('Ingresa valores numéricos válidos para los recursos.', { tipo: 'error' });
            return;
        }

        this.manager.ciudad.configurarRecursoDesdeIU('electricidad', electricidad);
        this.manager.ciudad.configurarRecursoDesdeIU('agua', agua);
        this.manager.ciudad.configurarRecursoDesdeIU('alimentos', alimentos);

        this.manager.save();
        this.actualizarUI();
        this.view.showToast(
            `Recursos ajustados manualmente: E=${electricidad}, A=${agua}, Al=${alimentos}.`,
            { tipo: 'success' }
        );
    }

    exportarCiudad() {
        try {
            if (!this.manager.ciudad) {
                alert('No hay ciudad cargada. Crea una ciudad primero.');
                return;
            }

            const filename = this.manager.exportToFile();
            if (filename) {
                console.log(`Archivo exportado: ${filename}`);
                alert(`✓ Exportación completada exitosamente.\nArchivo: ${filename}\n\nSe descargó un JSON con el estado completo de la ciudad.`);
            } else {
                alert('Error: No se pudo generar el archivo de exportación.');
            }
        } catch (error) {
            console.error('Error al exportar ciudad:', error);
            alert('Error al exportar la ciudad. Revisar consola.');
        }
    }

    actualizarUI() {
        const estado = this.manager.obtenerEstado();
        if (!estado) return;

        // Renderizar vista usando ViewController
        this.view.renderHeader(estado);
        this.view.renderEstadisticas(estado);
        this.view.renderRecursos(estado);
        this.view.renderClima(estado.clima);
        this.view.renderNoticias(estado.noticias);
        this.view.renderizarMapa(estado.mapa);
        this.view.renderOpcionesRuta(estado.edificios.lista || []);
        this.view.saveLastRenderMatrix(estado.mapa);
        
        // Renderizar información de la celda seleccionada si existe
        if (this.selectedCell) {
            const detallesEdificio = this.obtenerDetallesEdificio(this.selectedCell.x, this.selectedCell.y);
            this.view.renderDetallesEdificio(detallesEdificio);
        } else {
            this.view.renderDetallesEdificio(null);
        }
        
        if (estado.juegoFinalizado) {
            this.view.renderGameOverState(estado);
        } else {
            this.view.renderActiveState();
        }
    }

    obtenerDetallesEdificio(x, y) {
        const edificio = this.manager.ciudad?.obtenerEdificioPorCoordenadas(x, y);
        if (!edificio) {
            return null;
        }

        // Calcular costo de mantenimiento por turno
        const costoMantenimiento = Math.max(1, Math.round(edificio.costoConstruccion * 0.0001));

        // Construir array de recursos consumidos
        const recursosConsumidos = [];
        if (edificio.consumoElectricidad > 0) recursosConsumidos.push(`Electricidad: ${edificio.consumoElectricidad}`);
        if (edificio.consumoAgua > 0) recursosConsumidos.push(`Agua: ${edificio.consumoAgua}`);

        // Construir array de recursos producidos
        const recursosProducidos = [];
        if (edificio.produccionRecurso > 0) {
            if (edificio.tipo === 'U1') recursosProducidos.push(`Electricidad: ${edificio.produccionRecurso}`);
            else if (edificio.tipo === 'U2') recursosProducidos.push(`Agua: ${edificio.produccionRecurso}`);
            else if (edificio.tipo === 'I2') recursosProducidos.push(`Alimentos: ${edificio.produccionRecurso}`);
            else if (edificio.tipo === 'I1') recursosProducidos.push(`Dinero: ${edificio.ingresoPorTurno}`);
        }

        if (edificio.ingresoPorTurno > 0 && !['I1', 'C1', 'C2'].includes(edificio.tipo)) {
            recursosProducidos.push(`Dinero: ${edificio.ingresoPorTurno}`);
        }

        // Calcular ciudadanos/empleados por type
        let ciudadanosInfo = '';
        if (edificio.tipo.startsWith('R')) {
            ciudadanosInfo = `${edificio.ocupacionActual} / ${edificio.capacidadMaxima} ciudadanos`;
        } else if (['C1', 'C2', 'I1', 'I2', 'S1', 'S2', 'S3', 'U1', 'U2'].includes(edificio.tipo)) {
            ciudadanosInfo = `${edificio.ocupacionActual} / ${edificio.capacidadMaxima} empleados`;
        }

        // Calcular felicidad promedio si es residencial
        let felicidadResidencial = null;
        if (edificio.tipo.startsWith('R')) {
            if (edificio.ciudadanosAsignados && edificio.ciudadanosAsignados.length > 0) {
                const ciudadanos = edificio.ciudadanosAsignados
                    .map(id => this.manager.ciudad?.obtenerCiudadano(id))
                    .filter(c => c);
                if (ciudadanos.length > 0) {
                    const sumaFelicidad = ciudadanos.reduce((acc, c) => acc + (c.nivelFelicidad || 0), 0);
                    felicidadResidencial = Math.round(sumaFelicidad / ciudadanos.length);
                }
            }
        }

        return {
            id: edificio.id,
            tipo: edificio.tipo,
            coordenadas: { x: edificio.x, y: edificio.y },
            costoConstruccion: edificio.costoConstruccion,
            costoMantenimiento,
            recursosConsumidos,
            recursosProducidos,
            capacidad: edificio.capacidadMaxima,
            ocupacion: edificio.ocupacionActual,
            ciudadanosInfo,
            felicidadResidencial,
            estaOperativo: edificio.estaOperativo,
            reembolso: edificio.reembolsoDemolicion
        };
    }

    actualizarEstadisticas(estado) {
        const contenedor = document.getElementById('estadisticas-contenido');
        contenedor.innerHTML = `
            <div class="recurso">
                <span>Población Total:</span>
                <span>${estado.poblacion.total}</span>
            </div>
            <div class="recurso">
                <span>Con Vivienda:</span>
                <span>${estado.poblacion.conVivienda}</span>
            </div>
            <div class="recurso">
                <span>Con Empleo:</span>
                <span>${estado.poblacion.conEmpleo}</span>
            </div>
            <div class="recurso">
                <span>Felicidad Promedio:</span>
                <span>${estado.poblacion.felicidadPromedio}%</span>
            </div>
            <div class="recurso">
                <span>Edificios Totales:</span>
                <span>${estado.edificios.total}</span>
            </div>
        `;
    }

    actualizarRecursos(estado) {
        document.getElementById('dinero').textContent = `$${estado.recursos.dinero}`;
        document.getElementById('electricidad').textContent = `${estado.recursos.electricidad} MW`;
        document.getElementById('agua').textContent = `${estado.recursos.agua} m³`;
        document.getElementById('alimentos').textContent = `${estado.recursos.comida} unidades`;
    }

    actualizarClima(clima) {
        const contenedor = document.getElementById('clima-contenido');
        if (clima.ultimaActualizacion) {
            contenedor.innerHTML = `
                <div class="recurso">
                    <span>Condición:</span>
                    <span>${clima.condicion}</span>
                </div>
                <div class="recurso">
                    <span>Temperatura:</span>
                    <span>${clima.temperatura}°C</span>
                </div>
                <div class="recurso">
                    <span>Humedad:</span>
                    <span>${clima.humedad}%</span>
                </div>
                <div class="recurso">
                    <span>Viento:</span>
                    <span>${clima.velocidadViento} km/h</span>
                </div>
                <div class="recurso">
                    <span>Última actualización:</span>
                    <span>${clima.ultimaActualizacion.toLocaleString()}</span>
                </div>
            `;
        } else {
            contenedor.innerHTML = '<p>Datos climáticos no disponibles. Inicie los servicios externos.</p>';
        }
    }

    actualizarNoticias(noticias) {
        const contenedor = document.getElementById('noticias-contenido');
        if (noticias && noticias.length > 0) {
            contenedor.innerHTML = noticias.map(noticia => `
                <div class="noticia-item">
                    <h3>${noticia.titulo}</h3>
                    <p>${noticia.descripcion || 'Sin descripción disponible'}</p>
                    ${noticia.enlace ? `<a href="${noticia.enlace}" target="_blank">Leer más</a>` : ''}
                </div>
            `).join('');
        } else {
            contenedor.innerHTML = '<p>No hay noticias disponibles. Inicie los servicios externos.</p>';
        }
    }

    renderMapa(mapa) {
        const contenedor = document.getElementById('grid-container');
        const info = document.getElementById('info-celda');

        if (!mapa || !Array.isArray(mapa.grid)) {
            contenedor.innerHTML = '<p>Mapa no disponible.</p>';
            return;
        }

        contenedor.style.gridTemplateColumns = `repeat(${mapa.dimensiones.ancho}, 26px)`;
        contenedor.innerHTML = '';

        mapa.grid.forEach((fila, y) => {
            fila.forEach((tipo, x) => {
                const cell = document.createElement('div');
                cell.className = `map-cell map-cell--${tipo}`;
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.title = `(${x}, ${y}) - ${tipo}`;

                if (this.selectedCell && this.selectedCell.x === x && this.selectedCell.y === y) {
                    cell.classList.add('map-cell--selected');
                }

                cell.addEventListener('click', () => {
                    this.selectedCell = { x, y, tipo };
                    this.actualizarSeleccion();
                });

                contenedor.appendChild(cell);
            });
        });

        if (info) {
            if (this.selectedCell) {
                info.textContent = `Celda seleccionada: (${this.selectedCell.x}, ${this.selectedCell.y}) tipo: ${this.selectedCell.tipo}`;
            } else {
                info.textContent = 'Seleccione una celda para construir o demoler.';
            }
        }
    }

    actualizarSeleccion() {
        this.actualizarUI();
    }
}

// Inicializar la aplicación
const app = new App();
