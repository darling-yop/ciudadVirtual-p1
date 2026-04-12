/**
 * Noticia.js
 * Clase de modelo que representa una noticia obtenida de la API de NewsAPI.
 * Se utiliza para estructurar la información de cada artículo de noticias.
 */
class Noticia {
    /**
     * Constructor de la clase Noticia
     * @param {string} titulo - Título de la noticia
     * @param {string} descripcion - Descripción o resumen de la noticia
     * @param {string} imagen - URL de la imagen asociada a la noticia
     * @param {string} url - URL completa de la noticia
     */
    constructor(titulo, descripcion, imagen, url, fuente = 'newsapi', fecha = null) {
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.imagen = imagen;
        this.url = url;
        this.enlace = url;
        this.fuente = fuente;
        this.fecha = fecha;
    }

    /**
     * Método para obtener una representación en string de la noticia
     * @returns {string} - Título y descripción de la noticia
     */
    toString() {
        return `${this.titulo}: ${this.descripcion}`;
    }
}

export { Noticia };
