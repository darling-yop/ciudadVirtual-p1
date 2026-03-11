# Cambios en la Clase Ciudadano

## Resumen de Cambios
Se han añadido métodos funcionales a la clase `Ciudadano` en el archivo `modelos/Ciudadano.js` para gestionar el estado del ciudadano según las especificaciones del juego.

## Métodos Añadidos

### Gestión de Vivienda
- **`asignarVivienda()`**: Establece el estado de vivienda como `true`, indicando que el ciudadano tiene una casa asignada.
- **`desasignarVivienda()`**: Establece el estado de vivienda como `false`, indicando que el ciudadano no tiene casa asignada.

### Gestión de Empleo
- **`asignarEmpleo()`**: Establece el estado de empleo como `true`, indicando que el ciudadano tiene trabajo asignado.
- **`desasignarEmpleo()`**: Establece el estado de empleo como `false`, indicando que el ciudadano no tiene trabajo asignado.

### Gestión de Consumos
- **`actualizarConsumos(agua, electricidad, comida)`**: Actualiza los valores de consumo por turno para agua, electricidad y comida. Los parámetros son opcionales y por defecto son 0.

### Gestión de Felicidad
- **`actualizarFelicidad()`**: Calcula y actualiza el nivel de felicidad del ciudadano basado en:
  - **Bonus por vivienda**: +10 si tiene casa, -15 si no tiene.
  - **Bonus por empleo**: +10 si tiene trabajo, -10 si no tiene.
  - **Penalización por consumos pendientes**: -5 por cada tipo de consumo (agua, electricidad, comida) que tenga valor mayor a 0.
  - El nivel de felicidad se mantiene en el rango 0-100.

### Obtención de Estado
- **`obtenerEstado()`**: Retorna un objeto con todos los atributos actuales del ciudadano, incluyendo ID, nombre, username, email, nivel de felicidad, estados de vivienda y empleo, y consumos actuales.

## Notas Técnicas
- Todos los métodos están implementados en JavaScript puro sin dependencias externas.
- La clase mantiene la funcionalidad existente y añade comportamiento específico del dominio del juego.
- Los métodos son directamente utilizables para gestionar el estado de los ciudadanos en el sistema.