/**
 * Servicio para gestionar la integración con NewsAPI
 * Proporciona noticias reales para inmersión en la simulación
 */
import { Noticia } from '../modelos/Noticia.js';
import { NEWS_API_KEY } from './config.js';

const FALLBACK_NEWS = {
    ar: [
        {
            titulo: 'Plan de movilidad urbana avanza en la región',
            descripcion: 'Autoridades reportan mejoras en tiempos de traslado gracias a nuevos corredores viales.'
        },
        {
            titulo: 'Sube la inversión en espacios públicos',
            descripcion: 'Se anunciaron obras en parques y zonas verdes para fortalecer la calidad de vida urbana.'
        },
        {
            titulo: 'Comercios locales recuperan actividad',
            descripcion: 'El sector comercial registró crecimiento sostenido durante el último trimestre.'
        },
        {
            titulo: 'Actualización climática regional',
            descripcion: 'Meteorología prevé variabilidad de lluvias y recomienda gestión preventiva del agua.'
        },
        {
            titulo: 'Agenda cultural impulsa turismo interno',
            descripcion: 'Eventos comunitarios y ferias temáticas incrementan el flujo de visitantes.'
        }
    ],
    default: [
        {
            titulo: 'Boletín urbano: desarrollo e infraestructura',
            descripcion: 'Resumen local de avances en construcción, servicios y movilidad.'
        },
        {
            titulo: 'Economía ciudadana en recuperación',
            descripcion: 'Indicadores de empleo y comercio muestran tendencia positiva.'
        },
        {
            titulo: 'Servicios públicos con mejoras operativas',
            descripcion: 'Reporte técnico destaca estabilidad en redes de agua y energía.'
        },
        {
            titulo: 'Prevención climática y gestión territorial',
            descripcion: 'Se recomiendan medidas de adaptación para temporadas de lluvia intensa.'
        },
        {
            titulo: 'Participación comunitaria en proyectos urbanos',
            descripcion: 'Vecinos se integran en mesas de trabajo para priorizar intervenciones.'
        }
    ]
};

export class ServicioNoticias {
    constructor(country = 'ar') { // Argentina por defecto
        this.apiKey = NEWS_API_KEY;
        this.country = country;
        this.noticias = []; // Array de instancias de Noticia
        this.intervaloActualizacion = null;
    }

    #notificarActualizacion() {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('city-external-services-updated'));
        }
    }

    #esApiKeyValida() {
        const key = String(this.apiKey || '').trim();
        if (!key) return false;
        if (key === 'TU_API_KEY') return false;
        if (key === 'API_KEY_PLACEHOLDER') return false;
        return key.length > 10;
    }

    #buildNoticia(item, fuente = 'newsapi') {
        const ahora = new Date().toISOString();
        return new Noticia(
            item.titulo || item.title || 'Titulo no disponible',
            item.descripcion || item.description || 'Descripcion no disponible',
            item.imagen || item.urlToImage || '',
            item.enlace || item.url || '',
            fuente,
            item.fecha || item.publishedAt || ahora
        );
    }

    #getGoogleNewsQueryByCountry() {
        const mapping = {
            co: 'Colombia',
            mx: 'Mexico',
            es: 'Espana',
            ar: 'Argentina'
        };
        return mapping[this.country] || 'Latinoamerica';
    }

    #getGoogleNewsLocaleByCountry() {
        const mapping = {
            co: { hl: 'es-419', gl: 'CO', ceid: 'CO:es-419' },
            mx: { hl: 'es-419', gl: 'MX', ceid: 'MX:es-419' },
            es: { hl: 'es', gl: 'ES', ceid: 'ES:es' },
            ar: { hl: 'es-419', gl: 'AR', ceid: 'AR:es-419' }
        };
        return mapping[this.country] || { hl: 'es-419', gl: 'CO', ceid: 'CO:es-419' };
    }

    async #fetchConTimeout(url, options = {}, timeoutMs = 7000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            return await fetch(url, { ...options, signal: controller.signal });
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async #fetchTextWithProxy(targetUrl) {
        const rawProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        const jsonProxy = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

        try {
            const rawResponse = await this.#fetchConTimeout(rawProxy);
            if (rawResponse.ok) {
                return await rawResponse.text();
            }
        } catch (error) {
            console.warn('Proxy RAW no disponible para RSS:', error);
        }

        const jsonResponse = await this.#fetchConTimeout(jsonProxy);
        if (!jsonResponse.ok) {
            throw new Error(`Proxy RSS no disponible: ${jsonResponse.status}`);
        }

        const jsonPayload = await jsonResponse.json();
        return String(jsonPayload.contents || '');
    }

    async obtenerNoticiasDesdeRssRegional() {
        const locale = this.#getGoogleNewsLocaleByCountry();
        const query = this.#getGoogleNewsQueryByCountry();
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${locale.hl}&gl=${locale.gl}&ceid=${encodeURIComponent(locale.ceid)}`;

        const xmlText = await this.#fetchTextWithProxy(rssUrl);
        if (!xmlText) {
            throw new Error('RSS vacío desde Google News.');
        }

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const items = Array.from(xmlDoc.querySelectorAll('item')).slice(0, 5);

        if (items.length === 0) {
            throw new Error('No se encontraron items en RSS regional.');
        }

        const limpiarHtml = (html) => {
            const temp = document.createElement('div');
            temp.innerHTML = html || '';
            return (temp.textContent || '').trim();
        };

        return items.map((item) => {
            const title = item.querySelector('title')?.textContent || 'Titulo no disponible';
            const descriptionRaw = item.querySelector('description')?.textContent || 'Descripcion no disponible';
            const description = limpiarHtml(descriptionRaw) || 'Descripcion no disponible';
            const link = item.querySelector('link')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();

            return this.#buildNoticia({
                titulo: title,
                descripcion: description,
                enlace: link,
                fecha: pubDate
            }, 'google-rss');
        });
    }

    obtenerNoticiasFallbackLocal() {
        const source = FALLBACK_NEWS[this.country] || FALLBACK_NEWS.default;
        const ahora = new Date().toISOString();

        const slugify = (value = '') => String(value)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        return source.slice(0, 5).map((item, index) => {
            const slug = slugify(item.titulo) || `noticia-${index + 1}`;
            const enlace = `https://boletin.ciudad-virtual.local/${this.country}/${index + 1}-${slug}`;

            return this.#buildNoticia({
                ...item,
                enlace,
                fecha: ahora
            }, 'boletin.ciudad-virtual.local');
        });
    }

    /**
     * Obtiene las últimas noticias de NewsAPI y las convierte en instancias de Noticia
     * @returns {Array<Noticia>} - Array de instancias de Noticia
     */
    async obtenerNoticias() {
        try {
            if (this.#esApiKeyValida()) {
                const url = `https://newsapi.org/v2/top-headlines?country=${this.country}&apiKey=${this.apiKey}&pageSize=5`;
                const response = await this.#fetchConTimeout(url);

                if (!response.ok) {
                    throw new Error(`Error en la API: ${response.status}`);
                }

                const data = await response.json();

                // Validar que hay artículos
                if (!data.articles || !Array.isArray(data.articles)) {
                    throw new Error('No se encontraron artículos en la respuesta de la API');
                }

                const articulos = data.articles.slice(0, 5);
                if (articulos.length > 0) {
                    this.noticias = articulos.map((article) => this.#buildNoticia(article, 'newsapi'));
                    console.log('Noticias actualizadas desde NewsAPI:', this.noticias.length);
                    return this.noticias;
                }
            }

            try {
                this.noticias = await this.obtenerNoticiasDesdeRssRegional();
                console.log('Noticias actualizadas desde Google RSS:', this.noticias.length);
                return this.noticias;
            } catch (rssError) {
                console.warn('RSS regional no disponible, usando fallback local:', rssError);
            }

            this.noticias = this.obtenerNoticiasFallbackLocal();
            return this.noticias;
        } catch (error) {
            console.error('Error obteniendo noticias:', error);
            this.noticias = this.obtenerNoticiasFallbackLocal();
            return this.noticias;
        }
    }

    /**
     * Inicia la actualización automática cada 30 minutos
     */
    async iniciarActualizacionAutomatica() {
        // Mostrar noticias inmediatamente (fallback regional) y actualizar reales en segundo plano.
        if (!Array.isArray(this.noticias) || this.noticias.length === 0) {
            this.noticias = this.obtenerNoticiasFallbackLocal();
            this.#notificarActualizacion();
        }

        const refrescar = async () => {
            await this.obtenerNoticias();
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