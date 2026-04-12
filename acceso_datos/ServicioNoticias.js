/**
 * Servicio para gestionar la integración con NewsAPI
 * Proporciona noticias reales para inmersión en la simulación
 */
import { Noticia } from '../modelos/Noticia.js';
import { NEWS_API_KEY } from './config.js';

export class ServicioNoticias {
    constructor(country = 'ar') { // Argentina por defecto
        this.apiKey = NEWS_API_KEY;
        this.country = country;
        this.noticias = []; // Array de instancias de Noticia
        this.intervaloActualizacion = null;
    }

    /**
     * Obtiene las últimas noticias de NewsAPI y las convierte en instancias de Noticia
     * @returns {Array<Noticia>} - Array de instancias de Noticia
     */
    async obtenerNoticias() {
        try {
            const url = `https://newsapi.org/v2/top-headlines?country=${this.country}&apiKey=${this.apiKey}&pageSize=5`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error en la API: ${response.status}`);
            }

            const data = await response.json();

            // Validar que hay artículos
            if (!data.articles || !Array.isArray(data.articles)) {
                throw new Error('No se encontraron artículos en la respuesta de la API');
            }

            this.noticias = data.articles.map(article => 
                new Noticia(
                    article.title || 'Título no disponible',
                    article.description || 'Descripción no disponible',
                    article.urlToImage || '',
                    article.url || ''
                )
            );

            console.log('Noticias actualizadas:', this.noticias.length, 'noticias');
            return this.noticias;
        } catch (error) {
            console.error('Error obteniendo noticias:', error);
            // Devolver array vacío si falla la API para evitar romper el juego
            if (this.noticias.length === 0) {
                this.noticias = [
                    new Noticia('Noticias no disponibles', 'Error al cargar noticias. Verifica tu conexión a internet.', '', '')
                ];
            }
            return this.noticias;
        }
    }

    /**
     * Inicia la actualización automática cada 30 minutos
     */
    async iniciarActualizacionAutomatica() {
        await this.obtenerNoticias(); // Obtener noticias iniciales
        this.intervaloActualizacion = setInterval(() => {
            this.obtenerNoticias();
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
     * Retorna las noticias actuales como array de instancias de Noticia
     * @returns {Array<Noticia>} - Array de instancias de Noticia
     */
    obtenerNoticiasActuales() {
        return [...this.noticias];
    }

    /**
     * Actualiza el país para las noticias
     */
    actualizarPais(country) {
        this.country = country;
    }
}

// Exportación por defecto para asegurar compatibilidad con imports.
export default ServicioNoticias;

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServicioNoticias;
}