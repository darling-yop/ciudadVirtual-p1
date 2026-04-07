# 🧪 Guía de Pruebas - Botones de Control

## Requisitos Previos
- Abrir el navegador con DevTools (F12) abierto
- Ir a la pestaña "Console" para ver logs
- Crear una nueva ciudad o cargar una existente

---

## ✅ Test 1: Procesar Turno (Manual)

### Pasos:
1. Carga o crea una ciudad
2. Abre la consola (F12)
3. Haz click en botón **"Procesar Turno"** 

### Resultados Esperados:
```
✓ El número de turno aumenta en 1
✓ En consola ves: "Turno procesado: X → Y"
✓ Los recursos se actualizan (dinero, electricidad, agua)
✓ El mapa se renderiza de nuevo
✓ Se guarda automáticamente en LocalStorage
```

### Verificación:
- Abre DevTools → Application → LocalStorage → ciudadVirtual_partida_activa
- Busca `"turnoActual": X` y verifica que aumentó

---

## ✅ Test 2: Iniciar Servicios Externos

### Pasos:
1. Haz click en **"Iniciar Servicios Externos"**
2. Observa la consola

### Resultados Esperados:
```
✓ Botón se deshabilita y muestra "Servicios Iniciados ✓"
✓ Aparece alerta informativa al usuario
✓ En consola ves logs sobre los servicios iniciados
✓ Si no hay API keys: "API keys no configuradas. Continuando sin datos..."
```

### Verificación Manual (con API keys):
- En el panel derecho, sección "Clima Actual" debe mostrar temperatura real
- En el panel derecho, sección "Noticias Regionales" debe mostrar 5 noticias reales

**Nota:** Sin API keys configuradas, solo ves datos placeholder.

---

## ✅ Test 3: Iniciar Turnos Automáticos

### Pasos:
1. Haz click en **"Iniciar Turnos Automáticos"**
2. Observa durante 30 segundos

### Resultados Esperados:
```
✓ El botón "Iniciar Turnos Automáticos" se deshabilita
✓ El botón "Detener Turnos" se habilita (cambia de gris a azul/visible)
✓ Cada 10 segundos:
   - El turno aumenta en 1
   - Los recursos se actualizan
   - El mapa se actualiza
   - UI se renderiza
✓ En consola: "Iniciando ciclo automático de turnos (10 segundos por turno)"
```

### Verificación:
- Mira el reloj
- Tiempo 0:00 - Click en "Iniciar Turnos"
- Tiempo 0:10 - Debería cambiar turnoActual (revisa encabezado)
- Tiempo 0:20 - Turno aumenta de nuevo
- Tiempo 0:30 - Turno aumenta de nuevo
- Verifica que sea cada 10 segundos ±1

---

## ✅ Test 4: Detener Turnos Automáticos

### Pasos:
1. (Después de Test 3 - Turnos en marcha)
2. Haz click en **"Detener Turnos"**
3. Espera 15 segundos sin hacer nada

### Resultados Esperados:
```
✓ El botón "Detener Turnos" se deshabilita
✓ El botón "Iniciar Turnos Automáticos" se habilita de nuevo
✓ El turno se detiene (no avanza más)
✓ En consola: "Deteniendo ciclo automático de turnos"
```

### Verificación:
- Anota el turno actual
- Espera 15 segundos
- Verifica que el turno NO cambió

---

## ✅ Test 5: Exportar JSON

### Pasos:
1. Haz click en **"Exportar JSON"**
2. Espera a que se descargue el archivo
3. Observa los mensajes

### Resultados Esperados:
```
✓ En consola: "Archivo exportado: ciudad_[nombre]_[fecha].json"
✓ Aparece alerta con el nombre del archivo
✓ Se descarga un archivo JSON en tu carpeta de descargas
✓ El archivo contiene toda la información de la ciudad
```

### Verificación del Archivo:
1. Abre el archivo descargado con un editor de texto (VS Code, Notepad, etc)
2. Verifica que contiene JSON válido
3. Busca estos campos:
   ```json
   {
     "cityName": "...",
     "mayor": "...",
     "turn": X,
     "score": Y,
     "resources": {...},
     "map": [...],
     "buildings": [...]
   }
   ```

---

## 🔗 Test Integración: Flujo Completo

### Escenario: Simular una sesión de juego

**Tiempo estimado:** 3 minutos

### Pasos:

#### Fase 1: Setup (30 segundos)
```
1. Crea o carga una ciudad
2. Haz click en "Iniciar Servicios Externos"
   → Botón se deshabilita
   → Alerta confirma servicios iniciados
3. Verifica console.log: "Servicios externos iniciados..."
```

#### Fase 2: Juego Manual (60 segundos)
```
4. Haz click 5 veces en "Procesar Turno"
   → Turno debe ser: 5
   → Dinero puede haber aumentado/disminuido
   → Console muestra logs de cada turno
```

#### Fase 3: Automatización (60 segundos)
```
5. Haz click en "Iniciar Turnos Automáticos"
   → Botón se deshabilita
   → "Detener Turnos" se habilita
   → Cada 10 segundos avanza un turno
   
6. Espera 30 segundos (3 turnos automáticos)
   → Turno actual debería ser: 5+3 = 8
   
7. Haz click en "Detener Turnos"
   → Botones cambian estado
   → El turno se detiene
```

#### Fase 4: Exportación (30 segundos)
```
8. Haz click en "Exportar JSON"
   → Alerta con nombre del archivo
   → Archivo se descarga
   → Console log con ruta
```

### Resultado Final Esperado:
- ✅ Turno final: 8
- ✅ LocalStorage tiene estado guardado
- ✅ Archivo JSON descargado
- ✅ Console sin errores rojos

---

## 🐛 Troubleshooting

### Problema 1: "Botones no responden"
**Solución:**
1. Recarga la página (F5)
2. Abre DevTools (F12)
3. Revisa si hay errores rojos en consola
4. Si hay errores, copialos y reporte

### Problema 2: "Turnos no avanzan"
**Verificar:**
1. ¿Hay una ciudad cargada? (Debe haber nombre en header)
2. ¿Hay errores en consola? (Panel rojo)
3. Intenta procesar turno manualmente
4. Revisa que turnoActual exista en estado

### Problema 3: "Servicios externos no funcionan"
**Causas:**
1. API keys no configuradas → Mensaje normal, no es error
2. Conexión a internet no disponible
3. APIs bloqueadas por CORS

**Solución:**
- Configura API keys en ServicioClima.js y ServicioNoticias.js
- O simplemente sigue jugando sin datos en tiempo real

### Problema 4: Exportar JSON no descarga
**Verificar:**
1. Bloqueador de popups activado
2. Revisar carpeta de descargas (puede estar en carpeta por defecto)
3. Revisar console.log para mensajes de error

### Problema 5: "No hay ciudad cargada"
**Solución:**
1. Ve a "Elegir Ciudad" (header)
2. Crea una nueva ciudad o carga una guardada
3. Vuelve a intentar con el botón

---

## 📊 Indicadores de Éxito

### Todos los tests pasan si:
- [ ] Procesar turno: Número de turno aumenta
- [ ] Iniciar servicios: Botón se deshabilita con ✓
- [ ] Iniciar turnos: Turnos avanzan cada 10 segundos
- [ ] Detener turnos: Turnos se detienen, botón se habilita
- [ ] Exportar JSON: Archivo se descarga con datos

### Bonus - Tests Avanzados:
- [ ] Construir edificios mientras turnos automáticos corren
- [ ] Demoler edificios durante automático (sin romper ruta)
- [ ] Cambiar recursos mientras automático corre
- [ ] Procesar turnos manuales después de automaticos
- [ ] Exportar en diferentes puntos del juego

---

## 📱 Compatibilidad

Tested en:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari (version 14+)
- ⚠️ Mobile browsers (responsivo pero no optimizado)

---

## 🎯 Checklist Final

Antes de decir "Todo funciona":

- [ ] Console abierto durante pruebas
- [ ] Sin errores rojos en console
- [ ] Todos los 5 botones probados
- [ ] Turnos avanzan correctamente
- [ ] UI se actualiza después de cada acción
- [ ] Archivo JSON se puede descargar
- [ ] Estados guardan en LocalStorage
- [ ] Botones cambian estado visualmente

---

## 📞 Reporte de Problemas

Si algo no funciona, incluye:

1. **Navegador:** (Chrome, Firefox, etc.)
2. **Sistema Operativo:** (Windows, Mac, Linux)
3. **Pasos para reproducir:** (paso 1, paso 2...)
4. **Error esperado:** (X debería suceder)
5. **Error actual:** (pero sucedió Y)
6. **Screenshot/Video:** (Si es posible)
7. **Console log:** (Copiar errores rojos)

---

**¡Gracias por probar y reportar!** 🙌
