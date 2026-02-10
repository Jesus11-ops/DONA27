# 💰 Sistema de Control de Donaciones - v3.0 (Base de Datos Actualizada)

Sistema web para gestionar donaciones de congregaciones con Firebase.

## ✅ CAMBIOS APLICADOS

Se ha actualizado la configuración de Firebase en **TODOS** los archivos del sistema para usar la nueva base de datos:

**Nueva configuración aplicada:**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyATOoIiYUR-6wS-YP_bGIKo_ZI4ULdcmlQ",
  authDomain: "donaciones-54419.firebaseapp.com",
  projectId: "donaciones-54419",
  storageBucket: "donaciones-54419.firebasestorage.app",
  messagingSenderId: "439586066442",
  appId: "1:439586066442:web:4c04b30b83dad8f6b88ff3",
  measurementId: "G-4DG6DX5NSZ"
};
```

### Archivos actualizados:
- ✅ **donaciones-app.js** - Configuración actualizada
- ✅ **donaciones-auth.js** - Configuración actualizada
- ✅ **donaciones-exportar.js** - Configuración actualizada
- ⚪ **donaciones-dashboard.html** - Sin cambios necesarios
- ⚪ **donaciones-style.css** - Sin cambios necesarios
- ⚪ **index.html** - Sin cambios necesarios

## 🚀 Pasos para Implementar

### 1. Configurar Firebase Console

Ve a [Firebase Console](https://console.firebase.google.com/) y selecciona el proyecto **donaciones-54419**

#### A. Habilitar Authentication
1. Ve a **Authentication** en el menú lateral
2. Click en **Get Started**
3. Click en **Email/Password**
4. Activa el switch de **Email/Password**
5. Guarda los cambios

#### B. Configurar Firestore Database
1. Ve a **Firestore Database** en el menú lateral
2. Click en **Create Database**
3. Selecciona **Start in production mode**
4. Elige la ubicación más cercana (ejemplo: us-east1)
5. Click en **Enable**
6. Una vez creada, ve a la pestaña **Rules**
7. Copia y pega estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Colección de Donaciones
    match /Donaciones/{document} {
      allow read, write: if request.auth != null;
    }
    // Colección de usuarios
    match /users/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

8. Click en **Publish**

#### C. Configurar Storage
1. Ve a **Storage** en el menú lateral
2. Click en **Get Started**
3. Selecciona **Start in production mode**
4. Click en **Next** y luego **Done**
5. Una vez creado, ve a la pestaña **Rules**
6. Copia y pega estas reglas:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /donaciones/{allPaths=**} {
      // Solo usuarios autenticados pueden leer
      allow read: if request.auth != null;
      
      // Solo usuarios autenticados pueden subir
      // Máximo 5MB por archivo
      // Solo imágenes
      allow write: if request.auth != null 
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

7. Click en **Publish**

### 2. Subir Archivos al Hosting

Sube todos los archivos descargados a tu servidor web o hosting:

```
proyecto-donaciones-v3/
├── index.html                  # Página de login
├── donaciones-dashboard.html   # Dashboard principal
├── donaciones-auth.js          # Autenticación ✅ ACTUALIZADO
├── donaciones-app.js           # Lógica principal ✅ ACTUALIZADO
├── donaciones-exportar.js      # Exportar a Excel ✅ ACTUALIZADO
└── donaciones-style.css        # Estilos
```

### 3. Crear el Primer Usuario

1. Abre `index.html` en tu navegador
2. Click en **"Crear usuario"**
3. Ingresa:
   - **Email:** J3006091729@gmail.com (este será el administrador)
   - **Contraseña:** (la que prefieras)
4. Click en **"Crear usuario"**
5. Este usuario tendrá permisos completos de administrador

### 4. Crear Usuarios Adicionales (Opcional)

El sistema permite crear hasta **4 usuarios en total**:
- 1 usuario administrador (J3006091729@gmail.com) con permisos completos
- 3 usuarios adicionales con permisos de solo lectura

Para crear usuarios adicionales:
1. Inicia sesión con el usuario administrador
2. Usa el botón **"Crear usuario"** en la página de login
3. Los nuevos usuarios podrán:
   - ✅ Ver donaciones
   - ✅ Ver reportes y totales
   - ❌ No podrán registrar nuevas donaciones
   - ❌ No podrán editar o eliminar
   - ❌ No podrán exportar a Excel

## 🆕 CARACTERÍSTICAS v3.0

### ✅ ID Numérico para Cada Donación
- Cada donación tiene un **ID único y secuencial**
- Aparece en un badge dorado en las tarjetas
- Visible en la columna "ID" de la tabla de congregaciones

### ✅ IDs Clickeables - Navegación Directa 🎯
- **Click/tap** en cualquier ID de la tabla
- Scroll automático a la tarjeta correspondiente
- Efecto visual de resaltado (borde dorado por 2 segundos)
- Perfecto para móviles y tablets

### ✅ Columna "Donante" en Tabla
Muestra quiénes hicieron aportes individuales:
- **Modo "Todos"**: Lista todos los nombres de donantes
- **Modo "Ofrendas Solidarias"**: Muestra el pastor
- **Modo "Aportes Individuales"**: Muestra nombre de las personas

### ✅ Sistema de Permisos
- **Administrador (J3006091729@gmail.com):**
  - Registro de donaciones ✅
  - Edición y eliminación ✅
  - Exportar a Excel ✅
  
- **Usuarios regulares:**
  - Solo lectura ✅
  - Ver reportes ✅

### ✅ Exportación a Excel
Solo el administrador puede exportar con:
- Todas las donaciones ordenadas por fecha
- Totales automáticos
- Formato profesional con colores
- Separador de miles en montos

## 📱 Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Dispositivos móviles (iOS, Android)
- ✅ Tablets
- ✅ Responsive design

## 🔒 Seguridad

- Autenticación requerida para todo acceso
- Reglas de Firestore protegen los datos
- Storage solo acepta imágenes < 5MB
- Sistema de permisos granular por usuario

## ❓ Solución de Problemas

### Error: "Firebase: Error (auth/invalid-api-key)"
- Verifica que copiaste correctamente la configuración
- Asegúrate de que el proyecto Firebase esté activo

### No puedo crear usuarios
- Verifica que Authentication esté habilitado
- Confirma que las reglas de Firestore estén publicadas
- Revisa que no hayas alcanzado el límite de 4 usuarios

### Las imágenes no se suben
- Verifica que Storage esté habilitado
- Confirma que las reglas de Storage estén publicadas
- Asegúrate de que el archivo sea una imagen y < 5MB

### No veo mis donaciones
- Verifica que estés autenticado
- Confirma que Firestore tenga datos
- Revisa la consola del navegador (F12) para ver errores

## 📞 Soporte

Para problemas o preguntas, contacta al administrador del sistema.

---

**Iglesia Pentecostal Unida de Colombia**
Sistema desarrollado para el control de donaciones
**Versión 3.0 - Base de Datos: donaciones-54419**
