/**
 * Implementación del patrón Repository para la entidad Usuario.
 *  Fetch API [3, 4].
 */

const BASE_URL = '/api/v1/users'; // Endpoint base siguiendo convenciones REST [3]

export const userRepository = {
    
    /**
     * Obtiene todos los usuarios (Operación READ).
     * @returns {Promise<Array>} Listado de objetos de usuario.
     */
    async getUsers() {
        try {
            // Fetch devuelve una promesa por defecto en modo GET [3]
            const response = await fetch(BASE_URL);
            if (!response.ok) throw new Error('Error al recuperar usuarios');
            
            // Se debe convertir la respuesta de texto plano a objeto JS [5, 6]
            return await response.json();
        } catch (error) {
            console.error("Error en getUsers:", error);
            throw error;
        }
    },

    /**
     * Crea un nuevo usuario (Operación CREATE).
     * @param {Object} userData - Datos del usuario a persistir.
     */
    async createUser(userData) {
        try {
            const response = await fetch(BASE_URL, {
                method: 'POST', // Método para creación de recursos [3]
                headers: {
                    'Content-Type': 'application/json' // Esencial para que el backend reconozca el JSON [5]
                },
                // Los datos deben convertirse a cadena de texto antes del envío [5, 7]
                body: JSON.stringify(userData)
            });
            if (!response.ok) throw new Error('Error al crear usuario');
            return await response.json();
        } catch (error) {
            console.error("Error en createUser:", error);
            throw error;
        }
    },

    /**
     * Actualiza un usuario existente por su ID (Operación UPDATE).
     * @param {number|string} id - Identificador único del usuario.
     * @param {Object} userData - Datos nuevos.
     */
    async updateUser(id, userData) {
        try {
            const response = await fetch(`${BASE_URL}/${id}`, {
                method: 'PUT', // PUT para actualización completa [3, 5]
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            if (!response.ok) throw new Error('Error al actualizar usuario');
            return await response.json();
        } catch (error) {
            console.error("Error en updateUser:", error);
            throw error;
        }
    },

    /**
     * Elimina un usuario del sistema (Operación DELETE).
     * @param {number|string} id - ID del usuario a borrar.
     */
    async deleteUser(id) {
        try {
            const response = await fetch(`${BASE_URL}/${id}`, {
                method: 'DELETE' // Método para eliminación [3, 6]
            });
            if (response.ok) {
                console.log('Usuario eliminado con éxito');
                return true;
            }
            throw new Error('No se pudo eliminar el usuario');
        } catch (error) {
            console.error("Error en deleteUser:", error);
            throw error;
        }
    }
};