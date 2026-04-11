# Pruebas de Ciudad Virtual

Este documento agrupa las pruebas de los dos sistemas principales: cálculo de rutas y sistema de ciudadanos.

---

## Pruebas del Sistema de Cálculo de Rutas

### Precondiciones
1. Backend Flask ejecutándose en `http://127.0.0.1:5000`.
2. Aplicación Ciudad Virtual abierta en el navegador.
3. Al menos 2 edificios conectados por vías.

### Test 1: Calcular ruta desde la UI
1. Construir vías de prueba para crear un camino.
2. Construir dos edificios residenciales incluidos en ese camino.
3. Seleccionar edificio origen y destino en la sección "Calcular Ruta".
4. Presionar "Calcular Ruta".

**Validar:**
- La ruta se visualiza en el mapa.
- Un punto recorre la ruta.
- El mensaje muestra "Ruta encontrada. Distancia: N celdas".

### Test 2: Conexión con el backend
Ejecutar en la consola del navegador (F12):

```javascript
fetch('http://127.0.0.1:5000/api/calculate-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        map: [[1, 1, 1], [1, 0, 1], [1, 1, 1]],
        start: [0, 0],
        end: [2, 2]
    })
})
.then(r => r.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

**Validar:**
- Respuesta contiene `route`.
- No se recibe error de conexión.

### Test 3: Casos de error esperados
| Error esperado | Causa | Qué verificar |
|---|---|---|
| "No se pudo conectar con el backend" | Backend apagado | Ejecutar `python main.py` |
| "Edificios no conectados por vías" | Camino incompleto | Verificar vías conectadas |
| "No existe ruta disponible" | Ruta no existe | Conectar vías adicionales |
| "Edificio de origen no encontrado" | ID inválido | Seleccionar edificios correctos |

### Checklist - Rutas
- [ ] Dropdown origen muestra opciones.
- [ ] Dropdown destino muestra opciones.
- [ ] Botón calcular funciona.
- [ ] Ruta se dibuja en el mapa.
- [ ] Mensaje de estado se actualiza.
- [ ] No hay errores 404/500 en consola.

---

## Pruebas del Sistema de Ciudadanos

### Precondiciones
1. Aplicación Ciudad Virtual abierta.
2. Ciudad con recursos suficientes.
3. Edificios residenciales construidos.
4. Edificios comerciales/industriales construidos.
5. Servicios o parques construidos para probar felicidad.

### Test 1: Creación automática de ciudadanos
**Objetivo:** validar que se generan ciudadanos cuando:
- Felicidad promedio > 60.
- Hay viviendas disponibles.
- Hay empleos disponibles.

**Pasos:**
1. Construir R1 x2, C1 x2, I1 x1, S1 x2.
2. Procesar 5 turnos.
3. Observar crecimiento de población.

**Validar:**
- Población aumenta entre 1 y 3 por turno.
- El aumento está limitado por capacidad y empleos.

### Test 2: Asignación automática de vivienda
**Objetivo:** validar que los ciudadanos nuevos reciben vivienda.

**Pasos:**
1. Procesar turnos con ciudad construida.
2. Revisar "Con Vivienda".

**Validar:**
- "Con Vivienda" es igual o cercano al total de ciudadanos.
- Cuando no hay vivienda disponible, no se crean nuevos ciudadanos.

### Test 3: Asignación automática de empleo
**Objetivo:** validar que los ciudadanos reciben empleo cuando hay vacantes.

**Pasos:**
1. Construir más empleos (C1, C2, I1, I2).
2. Procesar turnos.
3. Revisar "Con Empleo".

**Validar:**
- "Con Empleo" sube junto con la población.
- Está limitado por empleos disponibles.

### Test 4: Cálculo de felicidad individual
Ejecutar en consola:

```javascript
const ciudad = app.manager.ciudad;
const ciudadanos = ciudad.poblacion;
console.log(ciudadanos[0].obtenerEstado());
```

**Validar:**
- Con vivienda y empleo el ciudadano sube.
- Sin vivienda, la felicidad baja 20.
- Sin empleo, la felicidad baja 15.

### Test 5: Felicidad promedio y crecimiento
**Objetivo:** confirmar el umbral de crecimiento.

**Pasos:**
1. Consultar `ciudad.obtenerFelicidadPromedio()`.
2. Añadir servicios/parques.
3. Procesar turnos.

**Validar:**
- Si la felicidad está por encima de 60, la población crece.
- Si la felicidad está en 60 o menor, no hay crecimiento.

### Test 6: Bonus por servicios y parques
**Objetivo:** validar que cada S1/S2/S3/P1 aporta +2 a felicidad.

**Pasos:**
1. Construir varios servicios/parques.
2. Procesar turnos.

**Validar:**
- La felicidad aumenta en función del número de edificios de servicio.

### Test 7: Efectos de alimentos
**Objetivo:** validar el impacto de los alimentos en la felicidad.

**Escenarios:**
- Sin alimentos → felicidad baja -8 por turno.
- Alimentos ≥ población → felicidad sube +5.
- Alimentos ≥ 50% población → felicidad sube +1.

### Test 8: Estadísticas generales
Ejecutar en consola:

```javascript
const estado = app.manager.ciudad.obtenerEstadoGeneral();
console.log(estado);
console.log(app.manager.ciudad.obtenerEstadisticasCiudad());
```

**Validar:**
- Totales de población, vivienda y empleo son coherentes.
- La felicidad promedio está entre 0 y 100.
- Las tasas de desempleo y ocupación laboral son correctas.

### Checklist - Ciudadanos
- [ ] Ciudadanos se generan automáticamente.
- [ ] Asignación de vivienda funciona.
- [ ] Asignación de empleo funciona.
- [ ] Felicidad se actualiza correctamente.
- [ ] Servicios influyen en felicidad.
- [ ] Alimentos afectan felicidad.
- [ ] Estadísticas reflejan el estado real.
- [ ] No hay errores críticos en consola.

---

## Uso conjunto

### Flujo recomendado
1. Construir infraestructura básica.
2. Procesar turnos.
3. Verificar crecimiento de población.
4. Revisar estadísticas de vivienda y empleo.
5. Ajustar recursos si es necesario.
6. Probar rutas entre edificios.

### Mensajes clave
- Si el backend de rutas falla, no funciona el cálculo de la ruta.
- Si la felicidad baja, el crecimiento poblacional se detiene.
- Si no hay capacidad de vivienda o empleo, no se generan ciudadanos nuevos.

---

## Conclusión
Este archivo agrupa todas las pruebas necesarias para validar los dos sistemas principales de la aplicación sin necesidad de múltiples archivos de prueba separados.
