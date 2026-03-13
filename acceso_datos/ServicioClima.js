/**
 * Servicio para gestionar la integración con OpenWeatherMap API
 * Proporciona datos climáticos reales para la simulación de la ciudad
 */
export class ServicioClima {
    constructor(apiKey, lat = -34.6037, lon = -58.3816) { // Buenos Aires por defecto
        this.apiKey = apiKey;
        this.lat = lat;
        this.lon = lon;
        this.datosClima = {
            temperatura: 0,
            condicion: '',
            humedad: 0,
            velocidadViento: 0,
            ultimaActualizacion: null
        };
        this.intervaloActualizacion = null;
    }

    /**
     * Obtiene datos climáticos actuales de OpenWeatherMap
     */
    async obtenerClima() {
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${this.lat}&lon=${this.lon}&appid=${this.apiKey}&units=metric&lang=es`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error en la API: ${response.status}`);
            }

            const data = await response.json();

            this.datosClima = {
                temperatura: Math.round(data.main.temp),
                condicion: this.traducirCondicion(data.weather[0].main),
                humedad: data.main.humidity,
                velocidadViento: Math.round(data.wind.speed * 3.6), // m/s a km/h
                ultimaActualizacion: new Date()
            };

            console.log('Datos climáticos actualizados:', this.datosClima);
            return this.datosClima;
        } catch (error) {
            console.error('Error obteniendo datos climáticos:', error);
            // En caso de error, mantener datos anteriores o usar valores por defecto
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
    iniciarActualizacionAutomatica() {
        this.obtenerClima(); // Obtener datos iniciales
        this.intervaloActualizacion = setInterval(() => {
            this.obtenerClima();
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
     * Retorna los datos climáticos actuales
     */
    obtenerDatosClimaActuales() {
        return { ...this.datosClima };
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