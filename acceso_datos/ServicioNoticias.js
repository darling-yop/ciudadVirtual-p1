/**
 * Servicio para gestionar la integración con NewsAPI
 * Proporciona noticias reales para inmersión en la simulación
 */
class ServicioNoticias {
    constructor(apiKey, country = 'ar') { // Argentina por defecto
        this.apiKey = apiKey;
        this.country = country;
        this.noticias = [];
        this.intervaloActualizacion = null;
    }

    /**
     * Obtiene las últimas noticias de NewsAPI
     */
    async obtenerNoticias() {
        try {
            const url = `https://newsapi.org/v2/top-headlines?country=${this.country}&apiKey=${this.apiKey}&pageSize=5`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error en la API: ${response.status}`);
            }

            const data = await response.json();

            this.noticias = data.articles.map(article => ({
                titulo: article.title,
                descripcion: article.description,
                imagen: article.urlToImage,
                enlace: article.url,
                fecha: new Date(article.publishedAt)
            }));

            console.log('Noticias actualizadas:', this.noticias.length, 'noticias');
            return this.noticias;
        } catch (error) {
            console.error('Error obteniendo noticias:', error);
            // En caso de error, mantener noticias anteriores
            return this.noticias;
        }
    }

    /**
     * Inicia la actualización automática cada 30 minutos
     */
    iniciarActualizacionAutomatica() {
        this.obtenerNoticias(); // Obtener noticias iniciales
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
     * Retorna las noticias actuales
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

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ServicioNoticias;
}