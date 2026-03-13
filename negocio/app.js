import { Ciudad } from '../modelos/Ciudad.js';

// Inicializar la aplicación
class App {
    constructor() {
        this.ciudad = null;
        this.serviciosIniciados = false;
        this.inicializarEventos();
    }

    inicializarEventos() {
        document.addEventListener('DOMContentLoaded', () => {
            this.crearCiudadInicial();
            this.actualizarUI();
        });

        document.getElementById('procesar-turno').addEventListener('click', () => {
            this.procesarTurno();
        });

        document.getElementById('iniciar-servicios').addEventListener('click', () => {
            this.iniciarServiciosExternos();
        });
    }

    crearCiudadInicial() {
        // Crear ciudad con configuración por defecto
        this.ciudad = new Ciudad(
            "Ciudad Simulada",
            "Alcalde Demo",
            {
                nombre: "Buenos Aires",
                coordenadas: { lat: -34.6037, lon: -58.3816 }
            },
            20, 20
        );
    }

    iniciarServiciosExternos() {
        if (!this.serviciosIniciados) {
            this.ciudad.iniciarServiciosExternos();
            this.serviciosIniciados = true;
            document.getElementById('iniciar-servicios').disabled = true;
            document.getElementById('iniciar-servicios').textContent = 'Servicios Iniciados';
            console.log('Servicios externos iniciados');
        }
    }

    procesarTurno() {
        if (this.ciudad) {
            this.ciudad.procesarTurno();
            this.actualizarUI();
        }
    }

    actualizarUI() {
        if (!this.ciudad) return;

        const estado = this.ciudad.obtenerEstadoGeneral();

        // Actualizar header
        document.getElementById('nombre-ciudad').textContent = estado.nombre;
        document.getElementById('turno').textContent = `Turno: ${estado.turno}`;
        document.getElementById('puntuacion').textContent = `Puntuación: ${estado.puntuacion}`;

        // Actualizar estadísticas
        this.actualizarEstadisticas(estado);

        // Actualizar clima
        this.actualizarClima(estado.clima);

        // Actualizar noticias
        this.actualizarNoticias(estado.noticias);
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
                <span>Dinero:</span>
                <span>$${estado.recursos.dinero}</span>
            </div>
            <div class="recurso">
                <span>Electricidad:</span>
                <span>${estado.recursos.electricidad} MW</span>
            </div>
            <div class="recurso">
                <span>Agua:</span>
                <span>${estado.recursos.agua} m³</span>
            </div>
            <div class="recurso">
                <span>Comida:</span>
                <span>${estado.recursos.comida} unidades</span>
            </div>
            <div class="recurso">
                <span>Edificios Totales:</span>
                <span>${estado.edificios.total}</span>
            </div>
        `;
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
}

// Inicializar la aplicación
const app = new App();