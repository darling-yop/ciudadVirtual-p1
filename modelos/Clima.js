/**
 * Clima.js
 * Clase de modelo que representa los datos climáticos de una ciudad.
 * Se utiliza para estructurar la información obtenida de la API de OpenWeatherMap.
 */
class Clima {
    /**
     * Constructor de la clase Clima
     * @param {number} temperatura - Temperatura en grados Celsius
     * @param {string} descripcion - Descripción del clima (ej: "Soleado", "Nublado")
     * @param {number} humedad - Humedad relativa en porcentaje
     * @param {number} viento - Velocidad del viento en km/h
     * @param {string} ciudad - Nombre de la ciudad
     */
    constructor(temperatura, descripcion, humedad, viento, ciudad) {
        this.temperatura = temperatura;
        this.descripcion = descripcion;
        this.humedad = humedad;
        this.viento = viento;
        this.ciudad = ciudad;
    }

    /**
     * Método para obtener una representación en string del clima
     * @returns {string} - Descripción completa del clima
     */
    toString() {
        return `${this.ciudad}: ${this.descripcion}, ${this.temperatura}°C, Humedad: ${this.humedad}%, Viento: ${this.viento} km/h`;
    }
}

export { Clima };
