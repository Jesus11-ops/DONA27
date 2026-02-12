# 🔄 ACTUALIZACIÓN v3.1 - Egresos y Saldo Disponible

## ✅ ¿Qué se actualizó?

He actualizado **TUS ARCHIVOS ACTUALES** agregándoles la funcionalidad de egresos **SIN PERDER NINGUNA DONACIÓN**.

### Archivos Modificados:
1. ✅ **donaciones-app.js** - Agregadas funciones de egresos
2. ✅ **donaciones-FOSU2.html** - Agregadas secciones de egresos y nuevo resumen
3. ✅ **donaciones-style.css** - Agregados estilos para egresos
4. ✅ **donaciones-exportar.js** - Exportación con 3 hojas (Donaciones, Egresos, Resumen)
5. ⚪ **donaciones-auth.js** - Sin cambios
6. ⚪ **index.html** - Sin cambios

---

## 🆕 Nuevas Funcionalidades

### 1. Registro de Egresos
- Formulario dedicado después del formulario de donaciones
- Campos: Fecha, Concepto, Descripción, Monto
- Solo el administrador puede registrar egresos

### 2. Resumen Financiero Mejorado
Ahora muestra **3 indicadores principales**:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  💵 INGRESOS    │  │  💸 EGRESOS     │  │  💰 SALDO       │
│  $5.745.400     │  │  $1.200.000     │  │  $4.545.400     │
│  23 donaciones  │  │  5 egresos      │  │  Disponible     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Más abajo** aparece el desglose de ingresos:
- Ofrendas Solidarias
- Aportes Individuales

### 3. Lista de Egresos
- Nueva sección al final mostrando todos los egresos
- Tarjetas con header rojo para diferenciarlos
- Botones de editar y eliminar (solo administrador)

### 4. Exportación Excel Mejorada
El archivo Excel ahora tiene **3 hojas**:
1. **Donaciones** - Todas las donaciones con totales
2. **Egresos** - Todos los egresos con totales
3. **Resumen** - Vista consolidada con saldo disponible

---

## 🚀 CÓMO IMPLEMENTAR

### Paso 1: Hacer Respaldo
**IMPORTANTE:** Antes de subir los archivos nuevos:
1. Descarga tus archivos actuales como respaldo
2. O exporta el Excel con tus donaciones actuales

### Paso 2: Subir Archivos Nuevos
**Sube TODOS estos archivos** a la vez (reemplazando los anteriores):

```
✅ donaciones-app.js          (ACTUALIZADO)
✅ donaciones-FOSU2.html       (ACTUALIZADO)
✅ donaciones-style.css        (ACTUALIZADO)
✅ donaciones-exportar.js      (ACTUALIZADO)
✅ donaciones-auth.js          (sin cambios, pero súbelo)
✅ index.html                  (sin cambios, pero súbelo)
```

### Paso 3: Limpiar Caché
1. Cierra todas las pestañas del sistema
2. Abre una pestaña nueva
3. Presiona **Ctrl + Shift + R** (Windows/Linux) o **Cmd + Shift + R** (Mac)
4. Esto forzará la recarga de todos los archivos

### Paso 4: Verificar
1. Inicia sesión
2. Deberías ver:
   - ✅ Tus donaciones anteriores intactas
   - ✅ Nueva sección "Registrar Nuevo Egreso"
   - ✅ Nuevo "Resumen Financiero" con 3 cajas grandes
   - ✅ Nueva sección "Registro de Egresos" (vacía al inicio)

---

## 🎯 CÓMO USAR

### Registrar un Egreso:
1. Ingresa la fecha
2. Escribe el concepto (Ej: "Pago de luz oficina")
3. (Opcional) Agrega descripción
4. Ingresa el monto
5. Click en "Guardar Egreso"

### Ver el Saldo:
- El saldo se calcula automáticamente: **Ingresos - Egresos**
- Si el saldo es negativo, aparecerá en rojo
- Si es positivo, aparecerá en verde

### Exportar a Excel:
1. Click en "Exportar Excel"
2. Se genera un archivo con 3 hojas:
   - Hoja 1: Todas las donaciones
   - Hoja 2: Todos los egresos
   - Hoja 3: Resumen con totales y saldo

---

## ⚠️ IMPORTANTE

### Firebase - Nueva Colección
Los egresos se guardarán en una nueva colección llamada **"Egresos"** en Firestore.
- No necesitas configurar nada
- Las reglas actuales ya permiten esta colección
- Tus donaciones NO se verán afectadas

### Permisos
- **Administrador (J3006091729@gmail.com):**
  - ✅ Puede registrar, editar y eliminar egresos
  - ✅ Puede exportar Excel con egresos

- **Usuarios regulares:**
  - ✅ Pueden VER egresos
  - ❌ NO pueden registrar, editar o eliminar egresos
  - ❌ NO pueden exportar Excel

---

## ✅ Verificación Post-Instalación

Después de subir los archivos, verifica que:

1. **Ves tus donaciones anteriores:**
   - Scroll hasta "Registro de Donaciones"
   - Deberías ver todas tus donaciones anteriores

2. **El resumen muestra totales correctos:**
   - Total Ingresos = suma de tus donaciones
   - Total Egresos = $0 (al inicio)
   - Saldo Disponible = Total Ingresos

3. **Puedes registrar un egreso de prueba:**
   - Ve a "Registrar Nuevo Egreso"
   - Registra un egreso pequeño
   - Verifica que el saldo se reste correctamente

---

## 🔧 Solución de Problemas

### No veo mis donaciones anteriores
**Solución:**
1. Presiona F12 (abre consola del navegador)
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Si ves "404 Not Found", verifica que subiste TODOS los archivos

### El saldo no se calcula
**Solución:**
1. Verifica que subiste el archivo `donaciones-app.js` actualizado
2. Limpia el caché: Ctrl + Shift + R
3. Recarga la página

### La sección de egresos no aparece
**Solución:**
1. Verifica que subiste el archivo `donaciones-FOSU2.html` actualizado
2. Verifica que estás usando la cuenta de administrador
3. Los usuarios regulares NO verán el formulario de registro

---

## 📊 Estructura de Datos

### Colección "Egresos" (Nueva)
```javascript
{
  fecha: "2025-02-11",
  diaSemana: "Martes",
  concepto: "Pago de servicios",
  descripcion: "Luz y agua oficina central",
  monto: 50000,
  creadoEn: "2025-02-11T10:30:00Z"
}
```

### Colección "Donaciones" (Sin cambios)
```javascript
{
  fecha: "2025-02-11",
  diaSemana: "Martes",
  nombreCongregacion: "Congregación Central",
  nombrePastor: "Pastor Juan",
  ofrendaSolidaria: 100000,
  // ... resto de campos
}
```

---

## 💡 Consejos de Uso

1. **Registra egresos inmediatamente** después de realizar un gasto
2. **Sé específico en el concepto** para facilitar el control
3. **Usa la descripción** para agregar detalles importantes
4. **Exporta Excel mensualmente** como respaldo
5. **Revisa el saldo semanalmente** para mantener el control

---

## 📞 Soporte

Si tienes problemas con la actualización:
1. Verifica que subiste TODOS los archivos
2. Limpia el caché del navegador
3. Revisa que tu Firebase esté activo
4. Verifica los errores en la consola (F12)

---

**Iglesia Pentecostal Unida de Colombia**  
Sistema actualizado a v3.1 - Control de Egresos y Saldo Disponible  
Base de Datos: donaciones-54419

**✅ Tus donaciones están seguras - Esta actualización solo AGREGA funcionalidad**
