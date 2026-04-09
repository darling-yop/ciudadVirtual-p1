import { CityRepository } from '../acceso_datos/CityRepository.js';
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
        this.selectedCell = null;
        this.selectedTipo = 'r';
        this.serviciosIniciados = false;

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

                console.log('Intento demoler en', cell);
                const resultado = this.manager.demoler(cell.x, cell.y);
                if (!resultado.exito) {
                    alert(`No se demolió: ${resultado.mensaje}`);
                } else {
                    console.log(`Demolición OK @(${cell.x},${cell.y})`);
                }
                this.view.limpiarRuta();
                this.view.setEstadoRuta('Ruta limpiada por cambio en el mapa.');
                this.actualizarUI();
            },
            onProcesarTurno: () => this.procesarTurno(),
            onIniciarServicios: () => this.iniciarServiciosExternos(),
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

    continuarPartidaGuardada(cityId = null) {
        this.manager.init(cityId);
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
            
            // Feedback visual
            const estado = this.manager.obtenerEstado();
            if (estado) {
                console.log(`Dinero: ${estado.dinero} | Electricidad: ${estado.electricidad} | Agua: ${estado.agua}`);
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
