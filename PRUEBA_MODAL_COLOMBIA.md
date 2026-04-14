# Prueba Modal Región Colombia

## Cambios Implementados

### 1. **viewController.js** - Métodos Agregados

Se han implementado los siguientes métodos para manejar la carga dinámica de datos de Colombia:

#### `_initializeColombia()`
- Carga departamentos desde `https://api-colombia.com/api/v1/Department`
- Carga municipios para cada departamento desde `https://api-colombia.com/api/v1/Department/{id}/cities`
- Si la API falla, usa datos locales como fallback (`this.colombiaMunicipios`)
- Se llama automáticamente en el constructor

#### `_useColombiaFallback()`
- Convierte datos locales de `this.colombiaMunicipios` al formato esperado
- Garantiza continuidad si no hay conexión a internet

#### `_populateDepartamentosModal()`
- Puebla el select `#input-departamento` con los departamentos cargados
- Estructura: `<option value="deptId">Nombre Departamento</option>`

#### `_populateMunicipiosModal(deptId)`
- Puebla `#input-municipio` basándose en el departamento seleccionado
- Almacena lat/lon en `option.dataset.lat` y `option.dataset.lon`
- Limpia el selector cuando se cambia el departamento

#### `_handleRegionVisibility()`
- Muestra/oculta campos según la región seleccionada
- Toggle de clases:
  - Si región = 'colombia' → muestra `#region-colombia`
  - Si región = 'custom' → muestra `#region-custom`
  - Si es otra → oculta ambas

### 2. **Event Listeners** (en `_bindEvents()`)

```javascript
// Cuando cambia la región seleccionada
el.inputRegion.addEventListener('change', () => {
    _handleRegionVisibility();
});

// Cuando cambia el departamento
el.inputDepartamento.addEventListener('change', () => {
    _populateMunicipiosModal(el.inputDepartamento.value);
});
```

### 3. **Actualización de `_gatherNewCityData()`**

Ahora usa datos dinámicos de `this.dataColombia`:
- Obtiene el departamento y municipio seleccionados (por ID)
- Busca sus nombres en la estructura `dataColombia`
- Devuelve región con formato: `"Municipio Name, Departamento Name"`
- Incluye coordenadas del municipio

## Pasos para Probar

### Test 1: Carga Inicial
1. Abre el navegador en `game.html`
2. Abre la consola (F12)
3. Busca mensajes:
   - ✓ "Datos de Colombia cargados exitosamente desde API"
   - ✓ O si falla: "Error cargando datos de Colombia, usando fallback local"

### Test 2: Modal Visibilidad
1. Crea o recupera una ciudad existente (abre modal)
2. En el select "Región" selecciona "Colombia"
3. Verifica que aparece el contenedor con Departamento/Municipio
4. Selecciona "Madrid" → desaparecen los campos
5. Vuelve a "Colombia" → reaparecen

### Test 3: Población de Selects
1. Con "Colombia" seleccionado:
   - El select "Departamento" debe mostrar opciones (mínimo 1)
   - Verifica que aparecen departamentos reales (ej: "Bogotá D.C.", "Antioquia", etc.)

### Test 4: Municipios Dinámicos
1. Selecciona un departamento (ej: "Cundinamarca")
2. El select "Municipio" debe actualizarse inmediatamente
3. Debe mostrar municipios de ese departamento

### Test 5: Coordinadas
1. Selecciona Departamento + Municipio
2. Abre DevTools → Console
3. Ejecuta:
   ```javascript
   document.getElementById('input-municipio').selectedOptions[0].dataset
   ```
4. Debes ver:
   ```
   DOMStringMap { lat: "4.711", lon: "-74.072" }
   ```

### Test 6: Validación de Formulario
1. Intenta crear ciudad sin seleccionar departamento/municipio
2. Debe mostrar: "Selecciona departamento y municipio en Colombia."
3. Selecciona ambos
4. Verifica que se envíe el formulario correctamente

### Test 7: Nombre de Región
1. Completa todos los campos (nombre, alcalde, tamaño)
2. Selecciona: Región = Colombia, Dept = Cundinamarca, Municipio = Bogotá
3. Envía formulario
4. En la consola o en la UI, verifica que región.nombre sea:
   - ✓ "Bogotá, Cundinamarca" (formato: "Municipio, Departamento")

## Estructura de Datos

### dataColombia
```javascript
{
  departamentos: [
    { id: 1, name: "Amazonas" },
    { id: 2, name: "Antioquia" },
    ...
  ],
  municipiosPorDepartamento: {
    1: [
      { id: "amazonas-leticia", name: "Leticia", latitude: 4.21, longitude: -69.94 },
      ...
    ],
    2: [
      { id: "antioquia-medellin", name: "Medellín", latitude: 6.24, longitude: -75.58 },
      ...
    ]
  }
}
```

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Departamentos no aparecen | Revisa consola, verifica conex. internet. API fallback debería activarse |
| Municipios no se actualizan | Verifica que listener está registrado: `console.log(el.inputDepartamento._listeners)` |
| Coordenadas no se guardan | Inspecciona que `mun.latitude` y `mun.longitude` existan en API response |
| Modal desaparece al seleccionar región | Verifica que `region-colombia` tiene `display: none` cuando región ≠ 'colombia' |

## URLs API Utilizadas

- Departamentos: `https://api-colombia.com/api/v1/Department`
- Municipios: `https://api-colombia.com/api/v1/Department/{id}/cities`

Ambas se ejecutan en paralelo durante `_initializeColombia()`.

---

**Última actualización:** [Ahora]  
**Estado:** Listo para pruebas ✅
