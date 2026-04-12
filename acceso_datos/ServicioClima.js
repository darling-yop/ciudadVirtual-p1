/**
 * Servicio para gestionar la integración con OpenWeatherMap API
 * Proporciona datos climáticos reales para la simulación de la ciudad
 */
import { Clima } from '../modelos/Clima.js';
import { OPENWEATHER_API_KEY } from './config.js';

export class ServicioClima {
    constructor(lat = -34.6037, lon = -58.3816, ciudad = 'Ciudad Desconocida') { // Buenos Aires por defecto
        this.apiKey = OPENWEATHER_API_KEY;
        this.lat = lat;
        this.lon = lon;
        this.ciudad = ciudad;
        this.datosClima = new Clima(20, 'Cargando...', 50, 10, this.ciudad); // estado inicial inmediato
        this.intervaloActualizacion = null;
    }

    #notificarActualizacion() {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('city-external-services-updated'));
        }
    }

    /**
     * Obtiene datos climáticos actuales de OpenWeatherMap y retorna un objeto Clima
     * @returns {Clima} - Instancia de Clima con los datos actuales
     */
    async obtenerClima() {
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${this.lat}&lon=${this.lon}&appid=${this.apiKey}&units=metric&lang=es`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error en la API: ${response.status}`);
            }

            const data = await response.json();

            // Validar que los datos necesarios estén presentes
            if (!data.main || !data.weather || !data.weather[0]) {
                throw new Error('Datos climáticos incompletos en la respuesta de la API');
            }

            const temperatura = Math.round(data.main.temp);
            const descripcion = this.traducirCondicion(data.weather[0].main);
            const humedad = data.main.humidity;
            const viento = Math.round((data.wind?.speed || 0) * 3.6); // m/s a km/h, con valor por defecto

            this.datosClima = new Clima(temperatura, descripcion, humedad, viento, this.ciudad);

            console.log('Datos climáticos actualizados:', this.datosClima.toString());
            return this.datosClima;
        } catch (error) {
            console.error('Error obteniendo datos climáticos:', error);
            // Devolver datos por defecto si falla la API
            if (!this.datosClima) {
                this.datosClima = new Clima(20, 'Soleado', 50, 10, this.ciudad);
            }
            return this.datosClima;
        }
    }

    /**
     * Traduce las condiciones climáticas de inglés a español
     */
    traducirCondicion(condicion) {
        const traducciones = {
            'Clear': 'Soleado',
            'Clouds': 'Nublado',
            'Rain': 'Lluvioso',
            'Drizzle': 'Llovizna',
            'Thunderstorm': 'Tormenta',
            'Snow': 'Nevado',
            'Mist': 'Niebla',
            'Fog': 'Niebla'
        };
        return traducciones[condicion] || condicion;
    }

    /**
     * Inicia la actualización automática cada 30 minutos
     */
    async iniciarActualizacionAutomatica() {
        // Publicar un estado inicial de inmediato y actualizar en segundo plano.
        this.#notificarActualizacion();

        const refrescar = async () => {
            await this.obtenerClima();
            this.#notificarActualizacion();
        };

        refrescar();

        this.intervaloActualizacion = setInterval(() => {
            refrescar();
        }, 30 * 60 * 1000); // 30 minutos
    }

    /**
     * Detiene la actualización automática
     */
    detenerActualizacion() {
        if (this.intervaloActualizacion) {
            clearInterval(this.intervaloActualizacion);
            this.intervaloActualizacion = null;
        }
    }

    /**
     * Retorna los datos climáticos actuales como instancia de Clima
     * @returns {Clima|null} - Instancia de Clima o null si no hay datos
     */
    obtenerDatosClimaActuales() {
        return this.datosClima;
    }

    /**
     * Actualiza las coordenadas de la ciudad
     */
    actualizarCoordenadas(lat, lon) {
        this.lat = lat;
        this.lon = lon;
    }
}

// Exportación por defecto para asegurar compatibilidad con imports.
export default ServicioClima;

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServicioClima;
}