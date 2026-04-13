/**
 * ViewController.js
 *
 * Maneja la interacción con la vista (DOM), renderizado y atajos de teclado.
 * Está desacoplado de la lógica de negocio (CityManager / App).
 */

import { Mapa } from '../modelos/Mapa.js';

export class ViewController {
    constructor({
        onCellSelected,
        onConstruir,
        onDemoler,
        onProcesarTurno,
        onIniciarServicios,
        onIniciarTurnos,
        onDetenerTurnos,
        onCalcularRuta,
        onExportar,
        onGuardar,
        onEliminarPartida,
        onContinuarPartida,
        onNuevaPartida,
        onAbrirSelectorCiudades,
        onCrearCiudad,
        onAplicarRecursos,
        onCancelar
    } = {}) {
        this.onCellSelected = onCellSelected;
        this.onConstruir = onConstruir;
        this.onDemoler = onDemoler;
        this.onProcesarTurno = onProcesarTurno;
        this.onIniciarServicios = onIniciarServicios;
        this.onIniciarTurnos = onIniciarTurnos;
        this.onDetenerTurnos = onDetenerTurnos;
        this.onCalcularRuta = onCalcularRuta;
        this.onExportar = onExportar;
        this.onGuardar = onGuardar;
        this.onEliminarPartida = onEliminarPartida;
        this.onContinuarPartida = onContinuarPartida;
        this.onNuevaPartida = onNuevaPartida;
        this.onAbrirSelectorCiudades = onAbrirSelectorCiudades;
        this.onCrearCiudad = onCrearCiudad;
        this.onAplicarRecursos = onAplicarRecursos;
        this.onCancelar = onCancelar;

        this.selectedTipo = 'r';
        this.selectedCell = null;
        this.mapaTexto = null;
        this.mapaGrid = null;
        this.routeCells = [];
        this.routeWalkerCell = null;
        this.routeAnimationToken = 0;
        this._toastTimeoutId = null;

        // Datos locales de Colombia (fallback)
        this.colombiaMunicipios = {
            'Cundinamarca': {
                'Bogotá': { lat: 4.711, lon: -74.072 },
                'Soacha': { lat: 4.579, lon: -74.212 }
            },
            'Antioquia': {
                'Medellín': { lat: 6.244, lon: -75.581 },
                'Envigado': { lat: 6.159, lon: -75.578 }
            },
            'Valle del Cauca': {
                'Cali': { lat: 3.451, lon: -76.531 },
                'Palmira': { lat: 3.539, lon: -76.303 }
            }
        };

        // Datos dinámicos de Colombia desde API
        this.dataColombia = {
            departamentos: [],
            municipiosPorDepartamento: {}
        };

        this._bindElements();
        this._bindEvents();
        this._initializeColombia();
    }

    _bindElements() {
        this.el = {
            nombreCiudad: document.getElementById('nombre-ciudad'),
            turno: document.getElementById('turno'),
            puntuacion: document.getElementById('puntuacion'),
            saveStatus: document.getElementById('save-status'),
            botonElegirCiudad: document.getElementById('boton-elegir-ciudad'),
            botonVerRanking: document.getElementById('boton-ver-ranking'),
            recursosContenido: document.getElementById('recursos-contenido'),
            climaContenido: document.getElementById('clima-contenido'),
            noticiasContenido: document.getElementById('noticias-contenido'),
            estadisticasContenido: document.getElementById('estadisticas-contenido'),
            gridContainer: document.getElementById('grid-container'),
            infoCelda: document.getElementById('info-celda'),
            botonProcesarTurno: document.getElementById('procesar-turno'),
            botonIniciarServicios: document.getElementById('iniciar-servicios'),
            botonIniciarTurnos: document.getElementById('boton-iniciar-turnos'),
            botonDetenerTurnos: document.getElementById('boton-detener-turnos'),
            botonExportar: document.getElementById('boton-exportar'),
            botonCalcularRuta: document.getElementById('boton-calcular-ruta'),
            botonLimpiarRuta: document.getElementById('boton-limpiar-ruta'),
            selectRutaOrigen: document.getElementById('ruta-origen'),
            selectRutaDestino: document.getElementById('ruta-destino'),
            estadoRuta: document.getElementById('estado-ruta'),
            botonConstruir: document.getElementById('boton-construir'),
            botonDemoler: document.getElementById('boton-demoler'),
            botonToggleRecursos: document.getElementById('toggle-recursos'),
            inputRecursoElectricidad: document.getElementById('input-recurso-electricidad'),
            inputRecursoAgua: document.getElementById('input-recurso-agua'),
            inputRecursoAlimentos: document.getElementById('input-recurso-alimentos'),
            botonAplicarRecursos: document.getElementById('boton-aplicar-recursos'),
            construccionMenu: document.querySelector('.construccion-menu'),
            recursosPanel: document.querySelector('.recursos-panel'),
            tipoButtons: Array.from(document.querySelectorAll('.construccion-menu button[data-tipo]')),
            continueGameModal: document.getElementById('continue-game-modal'),
            savedCitiesList: document.getElementById('saved-cities-list'),
            savedCitiesEmpty: document.getElementById('saved-cities-empty'),
            botonNuevaPartida: document.getElementById('boton-nueva-partida'),
            newCityModal: document.getElementById('new-city-modal'),
            newCityForm: document.getElementById('new-city-form'),
            inputCiudad: document.getElementById('input-ciudad'),
            inputAlcalde: document.getElementById('input-alcalde'),
            inputRegion: document.getElementById('input-region'),
            inputLat: document.getElementById('input-lat'),
            inputLon: document.getElementById('input-lon'),
            inputTamano: document.getElementById('input-tamano'),
            regionCustom: document.getElementById('region-custom'),
            regionColombia: document.getElementById('region-colombia'),
            inputDepartamento: document.getElementById('input-departamento'),
            inputMunicipio: document.getElementById('input-municipio'),
            botonCargarMapa: document.getElementById('boton-cargar-mapa'),
            inputMapaArchivo: document.getElementById('input-mapa-archivo'),
            estadoMapa: document.getElementById('estado-mapa')
        };
    }

    showToast(mensaje, { tipo = 'info', durationMs = 2600 } = {}) {
        if (!mensaje) return;

        let toastEl = document.getElementById('game-toast');
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.id = 'game-toast';
            toastEl.className = 'game-toast';
            toastEl.setAttribute('role', 'status');
            toastEl.setAttribute('aria-live', 'polite');
            document.body.appendChild(toastEl);
        }

        toastEl.textContent = mensaje;
        toastEl.className = `game-toast game-toast--${tipo}`;
        toastEl.classList.add('game-toast--visible');

        if (this._toastTimeoutId) {
            clearTimeout(this._toastTimeoutId);
        }

        this._toastTimeoutId = setTimeout(() => {
            toastEl.classList.remove('game-toast--visible');
        }, Math.max(1200, Number(durationMs) || 2600));
    }

    _bindEvents() {
        if (this.el.botonProcesarTurno) {
            this.el.botonProcesarTurno.addEventListener('click', () => {
                this.onProcesarTurno?.();
            });
        }

        if (this.el.botonIniciarServicios) {
            this.el.botonIniciarServicios.addEventListener('click', () => {
                this.onIniciarServicios?.();
            });
        }

        if (this.el.botonToggleRecursos) {
            this.el.botonToggleRecursos.addEventListener('click', () => {
                this._toggleRecursosPanel();
            });
        }

        if (this.el.botonIniciarTurnos) {
            this.el.botonIniciarTurnos.addEventListener('click', () => {
                this.onIniciarTurnos?.();
            });
        }

        if (this.el.botonDetenerTurnos) {
            this.el.botonDetenerTurnos.addEventListener('click', () => {
                this.onDetenerTurnos?.();
            });
        }

        if (this.el.botonExportar) {
            this.el.botonExportar.addEventListener('click', () => {
                this.onExportar?.();
            });
        }

        if (this.el.botonAplicarRecursos) {
            this.el.botonAplicarRecursos.addEventListener('click', () => {
                const recursos = {
                    electricidad: Number(this.el.inputRecursoElectricidad?.value ?? 0),
                    agua: Number(this.el.inputRecursoAgua?.value ?? 0),
                    alimentos: Number(this.el.inputRecursoAlimentos?.value ?? 0)
                };

                this.onAplicarRecursos?.(recursos);
            });
        }

        if (this.el.botonElegirCiudad) {
            this.el.botonElegirCiudad.addEventListener('click', () => {
                this.onAbrirSelectorCiudades?.();
            });
        }

        if (this.el.botonVerRanking) {
            this.el.botonVerRanking.addEventListener('click', () => {
                this.onVerRanking?.();
            });
        }

        if (this.el.botonNuevaPartida) {
            this.el.botonNuevaPartida.addEventListener('click', () => {
                this.onNuevaPartida?.();
            });
        }

        if (this.el.botonCalcularRuta) {
            this.el.botonCalcularRuta.addEventListener('click', async () => {
                const idOrigen = this.el.selectRutaOrigen?.value;
                const idDestino = this.el.selectRutaDestino?.value;
                await this.onCalcularRuta?.(idOrigen, idDestino);
            });
        }

        if (this.el.botonLimpiarRuta) {
            this.el.botonLimpiarRuta.addEventListener('click', () => {
                this.limpiarRuta();
                this.setEstadoRuta('Ruta limpiada.');
            });
        }

        if (this.el.newCityForm) {
            this.el.newCityForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const data = this._gatherNewCityData();
                if (data) {
                    this.hideNewCityModal();
                    this.onCrearCiudad?.(data);
                }
            });
        }

        // Listeners para región en formulario modal
        if (this.el.inputRegion) {
            this.el.inputRegion.addEventListener('change', () => {
                this._handleRegionVisibility();
            });
        }

        if (this.el.inputDepartamento) {
            this.el.inputDepartamento.addEventListener('change', () => {
                this._populateMunicipiosModal(this.el.inputDepartamento.value);
            });
        }

        if (this.el.botonCargarMapa && this.el.inputMapaArchivo && this.el.estadoMapa) {
            this.el.botonCargarMapa.addEventListener('click', () => {
                this.el.inputMapaArchivo.click();
            });

            this.el.inputMapaArchivo.addEventListener('change', async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                const text = await file.text();
                const result = this._parseMapaTexto(text);

                if (result.exito) {
                    this.mapaTexto = text;
                    this.mapaGrid = result.grid;
                    this.el.estadoMapa.textContent = `Mapa cargado (${result.ancho}x${result.alto})`;
                    this.el.estadoMapa.classList.remove('error');
                } else {
                    this.mapaTexto = null;
                    this.mapaGrid = null;
                    this.el.estadoMapa.textContent = `Error: ${result.mensaje}`;
                    this.el.estadoMapa.classList.add('error');
                }

                // Limpiar selección para permitir recargar el mismo archivo
                event.target.value = '';
            });
        }

        if (this.el.botonConstruir) {
            this.el.botonConstruir.addEventListener('click', () => {
                this.onConstruir?.(this.selectedCell, this.selectedTipo);
            });
        }

        if (this.el.botonDemoler) {
            this.el.botonDemoler.addEventListener('click', () => {
                this.onDemoler?.(this.selectedCell);
            });
        }

        this.el.tipoButtons.forEach(btn => {
            btn.addEventListener('click', (event) => {
                const tipo = event.target.dataset.tipo;
                if (tipo) {
                    this.selectedTipo = tipo;
                    this._highlightSelectedTipo();
                    console.log(`Construcción seleccionada: ${tipo}`);

                    // Si ya hay celda seleccionada, aplicar construcción directa para mejor experiencia UX
                    if (this.selectedCell && this.onConstruir) {
                        console.log(`Intentando construir ${tipo} en (${this.selectedCell.x}, ${this.selectedCell.y})`);
                        this.onConstruir(this.selectedCell, this.selectedTipo);
                    }
                }
            });
        });

        document.addEventListener('keydown', (event) => {
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return; // evitar atajos mientras escribe en campos de texto
            }

            switch (event.key.toLowerCase()) {
                case 'b':
                    this._toggleConstruccionMenu();
                    break;
                case 'r':
                    this.selectedTipo = 'r';
                    this._highlightSelectedTipo();
                    this._toggleConstruccionMenu(true);
                    break;
                case 'd':
                    this.onDemoler?.(this.selectedCell);
                    break;
                case 's':
                    this.onGuardar?.();
                    break;
                case 'escape':
                    this.clearSelection();
                    this.onCancelar?.();
                    break;
                default:
                    break;
            }
        });
    }

    _toggleConstruccionMenu(forceOpen = null) {
        if (!this.el.construccionMenu) return;
        const isOpen = this.el.construccionMenu.classList.contains('open');
        const shouldOpen = forceOpen === true ? true : (forceOpen === false ? false : !isOpen);
        this.el.construccionMenu.classList.toggle('open', shouldOpen);
        if (shouldOpen) {
            this.el.construccionMenu.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }

    _toggleRecursosPanel() {
        if (!this.el.recursosPanel) return;
        this.el.recursosPanel.classList.toggle('show');
        if (this.el.recursosPanel.classList.contains('show')) {
            this.el.recursosPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    showNewCityModal() {
        this.el.newCityModal?.classList.remove('hidden');
        this.el.newCityModal?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    hideNewCityModal() {
        this.el.newCityModal?.classList.add('hidden');
    }

    showContinueGameModal() {
        this.el.continueGameModal?.classList.remove('hidden');
    }

    hideContinueGameModal() {
        this.el.continueGameModal?.classList.add('hidden');
    }

    setSaveStatus(texto, estado = 'ok') {
        if (!this.el.saveStatus) return;
        this.el.saveStatus.textContent = texto;
        this.el.saveStatus.classList.remove('saving', 'error');

        if (estado === 'saving') this.el.saveStatus.classList.add('saving');
        if (estado === 'error') this.el.saveStatus.classList.add('error');
    }

    renderSavedCities(ciudades = [], activeCityId = null) {
        if (!this.el.savedCitiesList || !this.el.savedCitiesEmpty) return;

        this.el.savedCitiesList.innerHTML = '';
        this.el.savedCitiesEmpty.classList.toggle('hidden', ciudades.length > 0);

        const formatearFecha = (fechaIso) => {
            if (!fechaIso) return 'Sin fecha';
            const fecha = new Date(fechaIso);
            if (Number.isNaN(fecha.getTime())) return 'Sin fecha';
            return fecha.toLocaleString('es-CO');
        };

        ciudades.forEach((ciudad) => {
            const item = document.createElement('article');
            item.className = `saved-city-item${ciudad.id === activeCityId ? ' saved-city-item--active' : ''}`;

            const info = document.createElement('div');
            info.className = 'saved-city-item__info';

            const titulo = document.createElement('h3');
            titulo.textContent = ciudad.nombre || 'Ciudad sin nombre';
            info.appendChild(titulo);

            const meta = document.createElement('p');
            meta.className = 'saved-city-item__meta';
            meta.textContent = `Alcalde: ${ciudad.alcalde} | Turno: ${ciudad.turno} | Puntuación: ${ciudad.puntuacion} | Actualizado: ${formatearFecha(ciudad.updatedAt)}`;
            info.appendChild(meta);

            if (ciudad.id === activeCityId) {
                const badge = document.createElement('span');
                badge.className = 'saved-city-item__badge';
                badge.textContent = 'Activa';
                info.appendChild(badge);
            }

            const actions = document.createElement('div');
            actions.className = 'saved-city-item__actions';

            const cargarBtn = document.createElement('button');
            cargarBtn.type = 'button';
            cargarBtn.textContent = 'Cargar';
            cargarBtn.addEventListener('click', () => {
                this.onContinuarPartida?.(ciudad.id);
            });

            const eliminarBtn = document.createElement('button');
            eliminarBtn.type = 'button';
            eliminarBtn.className = 'danger';
            eliminarBtn.textContent = 'Eliminar';
            eliminarBtn.addEventListener('click', () => {
                this.onEliminarPartida?.(ciudad.id);
            });

            actions.appendChild(cargarBtn);
            actions.appendChild(eliminarBtn);
            item.appendChild(info);
            item.appendChild(actions);
            this.el.savedCitiesList.appendChild(item);
        });
    }

    _updateRegionInputs() {
        if (!this.el.inputRegion || !this.el.regionCustom || !this.el.regionColombia) return;

        const value = this.el.inputRegion.value;
        const isCustom = value === 'custom';
        const isColombia = value === 'colombia';

        this.el.regionCustom.classList.toggle('hidden', !isCustom);
        this.el.regionColombia.classList.toggle('hidden', !isColombia);

        if (isColombia && this.el.inputDepartamento?.value) {
            this._populateMunicipios(this.el.inputDepartamento.value);
        }
    }

    _populateMunicipios(departamento) {
        if (!this.el.inputMunicipio || !departamento) return;

        // Usar datos dinámicos si están disponibles, si no usar fallback
        let municipios = {};
        
        if (this.dataColombia.departamentos.length > 0) {
            // Buscar en datos dinámicos
            const deptId = Number(departamento);
            const municipiosArray = this.dataColombia.municipiosPorDepartamento[deptId];
            if (municipiosArray && municipiosArray.length > 0) {
                municipiosArray.forEach(mun => {
                    municipios[mun.name] = { lat: mun.latitude, lon: mun.longitude };
                });
            }
        }
        
        // Si no hay datos dinámicos o falló, usar datos locales
        if (Object.keys(municipios).length === 0) {
            municipios = this.colombiaMunicipios[departamento] || {};
        }
        
        this.el.inputMunicipio.innerHTML = '<option value="">Selecciona municipio</option>';

        Object.keys(municipios).forEach(mun => {
            const option = document.createElement('option');
            option.value = mun;
            option.textContent = mun;
            this.el.inputMunicipio.appendChild(option);
        });
    }

    _gatherNewCityData() {
        const nombre = this.el.inputCiudad?.value?.trim();
        const alcalde = this.el.inputAlcalde?.value?.trim();
        const regionKey = this.el.inputRegion?.value;
        const tamano = Number(this.el.inputTamano?.value);

        if (!nombre || !alcalde) {
            alert('Completa los campos de nombre de ciudad y alcalde.');
            return null;
        }

        if (!tamano || tamano < 15 || tamano > 30) {
            alert('El tamaño del mapa debe estar entre 15 y 30.');
            return null;
        }

        const regiones = {
            buenosaires: { nombre: 'Buenos Aires', coordenadas: { lat: -34.6037, lon: -58.3816 }, countryCode: 'ar' },
            mexico: { nombre: 'Ciudad de México', coordenadas: { lat: 19.4326, lon: -99.1332 }, countryCode: 'mx' },
            madrid: { nombre: 'Madrid', coordenadas: { lat: 40.4168, lon: -3.7038 }, countryCode: 'es' }
        };

        let region = regiones[regionKey];
        if (regionKey === 'colombia') {
            const deptId = this.el.inputDepartamento?.value;
            const munId = this.el.inputMunicipio?.value;

            if (!deptId || !munId) {
                alert('Selecciona departamento y municipio en Colombia.');
                return null;
            }

            // Convertir deptId a número para búsqueda consistente
            const deptIdNum = Number(deptId);
            const depa = this.dataColombia.departamentos.find(d => d.id === deptIdNum);
            const municipios = this.dataColombia.municipiosPorDepartamento[deptIdNum] || [];
            const mun = municipios.find(m => m.id === munId);

            if (!depa || !mun) {
                alert('No se encontraron los datos del departamento o municipio seleccionado.');
                return null;
            }

            region = {
                nombre: `${mun.name}, ${depa.name}`,
                coordenadas: {
                    lat: mun.latitude || parseFloat(this.el.inputLat?.value || 0),
                    lon: mun.longitude || parseFloat(this.el.inputLon?.value || 0)
                },
                countryCode: 'co'
            };
        }

        if (regionKey === 'custom') {
            const lat = parseFloat(this.el.inputLat?.value);
            const lon = parseFloat(this.el.inputLon?.value);
            if (Number.isNaN(lat) || Number.isNaN(lon)) {
                alert('Ingresa latitud y longitud válidas.');
                return null;
            }
            region = { nombre: 'Personalizada', coordenadas: { lat, lon }, countryCode: 'co' };
        }

        return {
            nombre,
            alcalde,
            region,
            tamano,
            mapaTexto: this.mapaTexto,
            mapaGrid: this.mapaGrid
        };
    }

    _parseMapaTexto(text) {
        if (!text || typeof text !== 'string') {
            return { exito: false, mensaje: 'Texto de mapa inválido.' };
        }

        const lines = text.split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lines.length === 0) {
            return { exito: false, mensaje: 'El archivo está vacío.' };
        }

        const tokenPattern = /(R[12]|C[12]|I[12]|S[123]|U[12]|P1|r|g)/g;
        const grid = lines.map(line => {
            const tokens = [...line.matchAll(tokenPattern)].map(m => m[0]);
            return tokens;
        }).filter(row => row.length > 0);

        if (grid.length === 0) {
            return { exito: false, mensaje: 'No se detectaron celdas válidas en el archivo.' };
        }

        const alto = grid.length;
        const ancho = Math.max(...grid.map(row => row.length));

        if (alto < 15 || alto > 30 || ancho < 15 || ancho > 30) {
            return {
                exito: false,
                mensaje: `Dimensiones inválidas: ${ancho}x${alto}. Debe ser entre 15x15 y 30x30.`
            };
        }

        // Completar filas cortas con terreno vacío
        const gridPadded = grid.map(row => {
            if (row.length < ancho) {
                return [...row, ...Array(ancho - row.length).fill('g')];
            }
            return row;
        });

        // Validar tipos permitidos
        for (const row of gridPadded) {
            for (const token of row) {
                if (!Mapa.esTipoValido(token)) {
                    return { exito: false, mensaje: `Tipo de celda inválido: '${token}'.` };
                }
            }
        }

        return { exito: true, grid: gridPadded, ancho, alto };
    }

    _highlightSelectedTipo() {
        if (!this.el.tipoButtons) return;
        this.el.tipoButtons.forEach(btn => {
            if (btn.dataset.tipo === this.selectedTipo) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });

        const tipoSelectedEl = document.getElementById('tipo-seleccionado');
        if (tipoSelectedEl) {
            tipoSelectedEl.textContent = this.selectedTipo || 'r';
        }
    }

    renderizarMapa(matriz) {
        if (!this.el.gridContainer) return;

        this._lastRenderedMatrix = matriz;

        const ancho = Number(matriz?.dimensiones?.ancho ?? matriz?.ancho ?? (matriz?.[0]?.length ?? 20));
        const alto = Number(matriz?.dimensiones?.alto ?? matriz?.alto ?? (matriz?.length ?? 20));
        const gridRaw = matriz?.grid ?? matriz;

        const normalizarTipo = (valor) => (Mapa.esTipoValido(valor) ? valor : 'g');

        let grid = [];
        if (Array.isArray(gridRaw) && gridRaw.length > 0) {
            grid = gridRaw.map((fila) => {
                if (!Array.isArray(fila)) {
                    return Array.from({ length: ancho }, () => 'g');
                }
                const filaNormalizada = fila.map(normalizarTipo);
                if (filaNormalizada.length < ancho) {
                    return [...filaNormalizada, ...Array(ancho - filaNormalizada.length).fill('g')];
                }
                return filaNormalizada.slice(0, ancho);
            });
        }

        if (grid.length < alto) {
            grid = [...grid, ...Array.from({ length: alto - grid.length }, () => Array(ancho).fill('g'))];
        }
        grid = grid.slice(0, alto);

        this.el.gridContainer.style.gridTemplateColumns = `repeat(${ancho}, 26px)`;
        this.el.gridContainer.innerHTML = '';

        grid.forEach((fila, y) => {
            fila.forEach((tipo, x) => {
                const cell = document.createElement('div');
                cell.className = `map-cell map-cell--${tipo}`;
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.title = `(${x}, ${y}) - ${tipo}`;

                if (this.selectedCell && this.selectedCell.x === x && this.selectedCell.y === y) {
                    cell.classList.add('map-cell--selected');
                }

                if (this.routeCells.some((routeCell) => routeCell.x === x && routeCell.y === y)) {
                    cell.classList.add('map-cell--route');
                }

                if (this.routeWalkerCell && this.routeWalkerCell.x === x && this.routeWalkerCell.y === y) {
                    cell.classList.add('map-cell--walker');
                }

                cell.addEventListener('click', () => {
                    this.selectedCell = { x, y, tipo };
                    this.onCellSelected?.({ x, y, tipo });
                    this._renderSelectedCellInfo();
                });

                this.el.gridContainer.appendChild(cell);
            });
        });

        this._renderSelectedCellInfo();
    }

    _renderSelectedCellInfo() {
        if (!this.el.infoCelda) return;
        if (this.selectedCell) {
            this.el.infoCelda.textContent = `Celda seleccionada: (${this.selectedCell.x}, ${this.selectedCell.y}) tipo: ${this.selectedCell.tipo}`;
        } else {
            this.el.infoCelda.textContent = 'Seleccione una celda para construir o demoler.';
        }
    }

    renderDetallesEdificio(detalles) {
        if (!this.el.infoCelda) return;

        if (!detalles) {
            this._renderSelectedCellInfo();
            return;
        }

        // Construir HTML detallado del edificio
        const tiposNombres = {
            'R1': 'Residencial 1', 'R2': 'Residencial 2',
            'C1': 'Comercial 1', 'C2': 'Comercial 2',
            'I1': 'Industrial 1', 'I2': 'Industrial 2',
            'U1': 'Utilidad - Electricidad', 'U2': 'Utilidad - Agua',
            'S1': 'Servicio - Policía', 'S2': 'Servicio - Bomberos', 'S3': 'Servicio - Hospital',
            'P1': 'Parque',
            'r': 'Vía'
        };

        const Estado = detalles.estaOperativo 
            ? '<span style="color: #4ade80;">Operativo</span>' 
            : '<span style="color: #f87171;">Inoperativo</span>';

        let html = `
            <div class="panel-edificio">
                <h3>${tiposNombres[detalles.tipo] || detalles.tipo}</h3>
                <div class="edificio-detalles">
                    <div class="fila">
                        <span class="etiqueta">Posición:</span>
                        <span>(${detalles.coordenadas.x}, ${detalles.coordenadas.y})</span>
                    </div>
                    <div class="fila">
                        <span class="etiqueta">Estado:</span>
                        <span>${Estado}</span>
                    </div>
                    <div class="fila">
                        <span class="etiqueta">Costo construcción:</span>
                        <span>$${detalles.costoConstruccion}</span>
                    </div>
                    <div class="fila">
                        <span class="etiqueta">Mantenimiento/turno:</span>
                        <span>$${detalles.costoMantenimiento}</span>
                    </div>
        `;

        if (detalles.capacidad > 0) {
            html += `
                    <div class="fila">
                        <span class="etiqueta">Ocupación:</span>
                        <span>${detalles.ocupacion} / ${detalles.capacidad}</span>
                    </div>
            `;
            if (detalles.ciudadanosInfo) {
                html += `
                    <div class="fila">
                        <span class="etiqueta">Asignados:</span>
                        <span>${detalles.ciudadanosInfo}</span>
                    </div>
                `;
            }
        }

        if (detalles.recursosConsumidos.length > 0) {
            html += `
                    <div class="fila">
                        <span class="etiqueta">Consume:</span>
                        <span>${detalles.recursosConsumidos.join(', ')}</span>
                    </div>
            `;
        }

        if (detalles.recursosProducidos.length > 0) {
            html += `
                    <div class="fila">
                        <span class="etiqueta">Produce:</span>
                        <span>${detalles.recursosProducidos.join(', ')}</span>
                    </div>
            `;
        }

        if (detalles.felicidadResidencial !== null) {
            html += `
                    <div class="fila">
                        <span class="etiqueta">Felicidad promedio:</span>
                        <span>${detalles.felicidadResidencial}%</span>
                    </div>
            `;
        }

        html += `
                    <div class="fila" style="margin-top: 10px;">
                        <button class="btn-demoler" onclick="window.dispatchEvent(new CustomEvent('demoler-edificio', {detail: {x: ${detalles.coordenadas.x}, y: ${detalles.coordenadas.y}}}))">
                            Demoler (reembolso: $${detalles.reembolso})
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.el.infoCelda.innerHTML = html;
    }

    renderHeader(estado) {
        if (!estado) return;
        if (this.el.nombreCiudad) this.el.nombreCiudad.textContent = estado.nombre;
        if (this.el.turno) {
            this.el.turno.textContent = `Turno: ${estado.turno}`;
            if (estado.juegoFinalizado) {
                this.el.turno.textContent += ' - JUEGO FINALIZADO';
            }
        }
        if (this.el.puntuacion) this.el.puntuacion.textContent = `Puntuación: ${estado.puntuacion}`;
    }

    renderActiveState() {
        const botones = [
            this.el.botonProcesarTurno,
            this.el.botonIniciarTurnos,
            this.el.botonConstruir,
            this.el.botonDemoler,
            this.el.botonCalcularRuta
        ];
        botones.forEach(boton => {
            if (boton) boton.disabled = false;
        });
        if (this.el.estadoRuta) {
            if (this.el.estadoRuta.classList) this.el.estadoRuta.classList.remove('estado-error');
        }
    }

    renderGameOverState(estado) {
        const botones = [
            this.el.botonProcesarTurno,
            this.el.botonIniciarTurnos,
            this.el.botonConstruir,
            this.el.botonDemoler,
            this.el.botonCalcularRuta
        ];
        botones.forEach(boton => {
            if (boton) boton.disabled = true;
        });

        if (this.el.estadoRuta) {
            this.el.estadoRuta.textContent = `Juego finalizado: ${estado.motivoFinJuego || 'Recursos negativos detectados'}`;
            if (this.el.estadoRuta.classList) this.el.estadoRuta.classList.add('estado-error');
        }
    }

    renderEstadisticas(estado) {
        if (!this.el.estadisticasContenido) return;
        this.el.estadisticasContenido.innerHTML = `
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

    renderRecursos(estado) {
        const dineroEl = document.getElementById('dinero');
        const electricidadEl = document.getElementById('electricidad');
        const aguaEl = document.getElementById('agua');
        const alimentosEl = document.getElementById('alimentos');

        if (dineroEl) {
            dineroEl.textContent = `$${estado.recursos.dinero}`;
            const container = dineroEl.parentElement;
            container?.classList.remove('dinero-verde', 'dinero-amarillo', 'dinero-rojo');
            if (estado.recursos.dinero > 10000) {
                container?.classList.add('dinero-verde');
            } else if (estado.recursos.dinero < 1000) {
                container?.classList.add('dinero-rojo');
            } else if (estado.recursos.dinero < 5000) {
                container?.classList.add('dinero-amarillo');
            }
        }

        if (electricidadEl) {
            electricidadEl.textContent = `${estado.recursos.electricidad} MW`;
        }
        if (aguaEl) {
            aguaEl.textContent = `${estado.recursos.agua} m³`;
        }
        if (alimentosEl) {
            const alimentos = Number(estado.recursos.alimentos ?? estado.recursos.comida ?? 0);
            alimentosEl.textContent = `${alimentos} unidades`;
        }

        if (this.el.inputRecursoElectricidad) {
            this.el.inputRecursoElectricidad.value = String(Number(estado.recursos.electricidad ?? 0));
        }

        if (this.el.inputRecursoAgua) {
            this.el.inputRecursoAgua.value = String(Number(estado.recursos.agua ?? 0));
        }

        if (this.el.inputRecursoAlimentos) {
            const alimentos = Number(estado.recursos.alimentos ?? estado.recursos.comida ?? 0);
            this.el.inputRecursoAlimentos.value = String(alimentos);
        }
    }

    renderClima(clima) {
        if (!this.el.climaContenido) return;
        const tieneDatosValidos = clima
            && typeof clima.descripcion !== 'undefined'
            && typeof clima.temperatura !== 'undefined'
            && typeof clima.humedad !== 'undefined'
            && typeof clima.viento !== 'undefined';

        if (tieneDatosValidos) {
            this.el.climaContenido.innerHTML = `
                <div class="recurso">
                    <span>Condición:</span>
                    <span>${clima.descripcion}</span>
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
                    <span>${clima.viento} km/h</span>
                </div>
            `;
        } else {
            this.el.climaContenido.innerHTML = '<p>Datos climáticos no disponibles. Inicie los servicios externos.</p>';
        }
    }

    renderNoticias(noticias) {
        if (!this.el.noticiasContenido) return;
        if (Array.isArray(noticias) && noticias.length > 0) {
            this.el.noticiasContenido.innerHTML = noticias.map(noticia => `
                <div class="noticia-item">
                    <h3>${noticia.titulo}</h3>
                    <p>${noticia.descripcion || 'Sin descripción disponible'}</p>
                    ${noticia.fuente ? `<p class="noticia-meta">Fuente: ${noticia.fuente}</p>` : ''}
                    ${noticia.fecha ? `<p class="noticia-meta">Actualización: ${new Date(noticia.fecha).toLocaleString('es-CO')}</p>` : ''}
                    ${(noticia.enlace || noticia.url) ? `<a href="${noticia.enlace || noticia.url}" target="_blank" rel="noopener">Leer más</a>` : ''}
                </div>
            `).join('');
        } else {
            this.el.noticiasContenido.innerHTML = '<p>No hay noticias disponibles. Inicie los servicios externos.</p>'; 
        }
    }

    clearSelection() {
        this.selectedCell = null;
        this._renderSelectedCellInfo();
        if (this.el.gridContainer) {
            // Re-render to remove selection highlights
            const matrix = this._lastRenderedMatrix;
            if (matrix) this.renderizarMapa(matrix);
        }
    }

    saveLastRenderMatrix(matriz) {
        this._lastRenderedMatrix = matriz;
    }

    renderOpcionesRuta(edificios = []) {
        if (!this.el.selectRutaOrigen || !this.el.selectRutaDestino) return;

        const renderOptions = (selectEl, selectedValue) => {
            selectEl.innerHTML = '<option value="">Selecciona</option>';
            edificios.forEach((edificio) => {
                const option = document.createElement('option');
                option.value = edificio.id;
                option.textContent = `${edificio.tipo} (${edificio.x},${edificio.y})`;
                if (String(edificio.id) === String(selectedValue)) {
                    option.selected = true;
                }
                selectEl.appendChild(option);
            });
        };

        renderOptions(this.el.selectRutaOrigen, this.el.selectRutaOrigen.value);
        renderOptions(this.el.selectRutaDestino, this.el.selectRutaDestino.value);
    }

    aplicarRuta(ruta = []) {
        this.routeCells = Array.isArray(ruta) ? ruta : [];
        this.routeWalkerCell = this.routeCells.length > 0 ? this.routeCells[0] : null;
        if (this._lastRenderedMatrix) {
            this.renderizarMapa(this._lastRenderedMatrix);
        }
    }

    async animarRuta(ruta = [], stepMs = 180) {
        this.routeAnimationToken += 1;
        const token = this.routeAnimationToken;

        this.aplicarRuta(ruta);
        if (!Array.isArray(ruta) || ruta.length === 0) return;

        for (let i = 0; i < ruta.length; i++) {
            if (token !== this.routeAnimationToken) return;

            this.routeWalkerCell = ruta[i];
            if (this._lastRenderedMatrix) {
                this.renderizarMapa(this._lastRenderedMatrix);
            }

            await new Promise((resolve) => setTimeout(resolve, stepMs));
        }
    }

    limpiarRuta() {
        this.routeAnimationToken += 1;
        this.routeCells = [];
        this.routeWalkerCell = null;
        if (this._lastRenderedMatrix) {
            this.renderizarMapa(this._lastRenderedMatrix);
        }
    }

    setEstadoRuta(mensaje, esError = false) {
        if (!this.el.estadoRuta) return;
        this.el.estadoRuta.textContent = mensaje;
        this.el.estadoRuta.classList.toggle('error', Boolean(esError));
    }

    /**
     * Inicializa datos de Colombia desde api-colombia.com
     * Usa fallback local si la API no está disponible
     */
    async _initializeColombia() {
        try {
            console.log('Iniciando carga de datos de Colombia desde API...');
            const respDepts = await fetch('https://api-colombia.com/api/v1/Department');
            if (!respDepts.ok) throw new Error('No se pudo cargar departamentos');
            
            const departamentos = await respDepts.json();
            this.dataColombia.departamentos = departamentos;
            console.log('Departamentos cargados:', departamentos.length);

            // Cargar municipios para cada departamento
            for (const dept of departamentos) {
                try {
                    const respMunis = await fetch(`https://api-colombia.com/api/v1/Department/${dept.id}/cities`);
                    if (respMunis.ok) {
                        const municipios = await respMunis.json();
                        this.dataColombia.municipiosPorDepartamento[dept.id] = municipios;
                        console.log(`${dept.name}: ${municipios.length} municipios`);
                    }
                } catch (e) {
                    console.warn(`No se pudieron cargar municipios para ${dept.name}:`, e);
                }
            }

            console.log('✅ Datos de Colombia cargados exitosamente desde API');
            console.log('dataColombia:', this.dataColombia);
            this._populateDepartamentosModal();
        } catch (error) {
            console.error('❌ Error cargando datos de Colombia:', error);
            this._useColombiaFallback();
        }
    }

    /**
     * Usa datos locales como fallback
     */
    _useColombiaFallback() {
        this.dataColombia.departamentos = Object.keys(this.colombiaMunicipios).map((nombre, idx) => ({
            id: idx,
            name: nombre
        }));
        
        this.dataColombia.municipiosPorDepartamento = {};
        Object.entries(this.colombiaMunicipios).forEach(([depa, municipios]) => {
            const deptId = this.dataColombia.departamentos.find(d => d.name === depa)?.id;
            if (deptId !== undefined) {
                this.dataColombia.municipiosPorDepartamento[deptId] = Object.entries(municipios).map(([name, coords]) => ({
                    id: `${depa}-${name}`,
                    name: name,
                    latitude: coords.lat,
                    longitude: coords.lon
                }));
            }
        });
        
        this._populateDepartamentosModal();
    }

    /**
     * Puebla el selector de departamentos en el modal
     */
    _populateDepartamentosModal() {
        if (!this.el.inputDepartamento) return;
        
        this.el.inputDepartamento.innerHTML = '<option value="">Selecciona departamento</option>';
        
        console.log('Poblando departamentos, cantidad:', this.dataColombia.departamentos.length);
        this.dataColombia.departamentos.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = dept.name;
            this.el.inputDepartamento.appendChild(option);
            console.log(`  Agregado: ${dept.name} (id: ${dept.id})`);
        });
    }

    /**
     * Puebla el selector de municipios en el modal
     */
    _populateMunicipiosModal(deptId) {
        if (!this.el.inputMunicipio) return;
        
        console.log('_populateMunicipiosModal llamado con deptId:', deptId, 'tipo:', typeof deptId);
        this.el.inputMunicipio.innerHTML = '<option value="">Selecciona municipio</option>';
        
        // Convertir deptId a número porque viene como string del HTML
        const deptIdNum = Number(deptId);
        console.log('Buscando con deptIdNum:', deptIdNum);
        console.log('Claves disponibles en municipiosPorDepartamento:', Object.keys(this.dataColombia.municipiosPorDepartamento));
        
        const municipios = this.dataColombia.municipiosPorDepartamento[deptIdNum];
        if (!municipios || municipios.length === 0) {
            console.warn(`❌ No hay municipios para departamento ${deptId}`);
            return;
        }
        
        console.log(`✅ Encontrados ${municipios.length} municipios`);
        municipios.forEach(mun => {
            const option = document.createElement('option');
            option.value = mun.id;
            option.textContent = mun.name;
            option.dataset.lat = mun.latitude || 0;
            option.dataset.lon = mun.longitude || 0;
            this.el.inputMunicipio.appendChild(option);
        });
    }

    /**
     * Maneja la visibilidad de campos según la región seleccionada
     */
    _handleRegionVisibility() {
        const region = this.el.inputRegion?.value;
        
        if (this.el.regionColombia) {
            this.el.regionColombia.classList.toggle('hidden', region !== 'colombia');
        }
        if (this.el.regionCustom) {
            this.el.regionCustom.classList.toggle('hidden', region !== 'custom');
        }

        // Limpiar selects cuando cambia región
        if (this.el.inputDepartamento) {
            this.el.inputDepartamento.value = '';
        }
        if (this.el.inputMunicipio) {
            this.el.inputMunicipio.value = '';
        }
    }
}
