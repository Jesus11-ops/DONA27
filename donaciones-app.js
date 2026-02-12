import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// ⚠️ IMPORTANTE: Configuración de Firebase del proyecto DONACIONES
const firebaseConfig = {
  apiKey: "AIzaSyATOoIiYUR-6wS-YP_bGIKo_ZI4ULdcmlQ",
  authDomain: "donaciones-54419.firebaseapp.com",
  projectId: "donaciones-54419",
  storageBucket: "donaciones-54419.firebasestorage.app",
  messagingSenderId: "439586066442",
  appId: "1:439586066442:web:4c04b30b83dad8f6b88ff3",
  measurementId: "G-4DG6DX5NSZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

console.log("🔥 Firebase Donaciones App conectado");

// ==================== CONTROL DE PERMISOS ====================
// Email del único usuario con permisos de edición
const ADMIN_EMAIL = 'J3006091729@gmail.com';

// Variable global para almacenar si el usuario actual es admin
let esUsuarioAdmin = false;

// Variables globales para filtrado de congregaciones
let congregacionesGlobal = {};
let filtroActual = 'todos';
let donacionesGlobal = [];  // NUEVO v3.0: Almacena donaciones con IDs numéricos para relacionar tabla y tarjetas
let egresosGlobal = [];  // 🆕 v3.1: Almacena egresos

// Función para verificar si el usuario actual es admin
function verificarPermisos(userEmail) {
  esUsuarioAdmin = userEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  console.log(`👤 Usuario: ${userEmail} | Admin: ${esUsuarioAdmin}`);
  
  // Mostrar/ocultar elementos según permisos
  actualizarInterfazSegunPermisos();
  
  return esUsuarioAdmin;
}

// Función para actualizar la interfaz según permisos
function actualizarInterfazSegunPermisos() {
  // Ocultar/mostrar sección de registro
  const seccionRegistro = document.querySelector('.card:has(#fecha)');
  if (seccionRegistro) {
    seccionRegistro.style.display = esUsuarioAdmin ? 'block' : 'none';
  }
  
  // 🆕 v3.1: Ocultar/mostrar sección de egresos
  const seccionEgresos = document.querySelector('.card:has(#egresoConcepto)');
  if (seccionEgresos) {
    seccionEgresos.style.display = esUsuarioAdmin ? 'block' : 'none';
  }
  
  // Actualizar el header para mostrar el rol del usuario
  const headerRight = document.querySelector('.header-right');
  if (headerRight && !document.getElementById('rolUsuario')) {
    const rolIndicator = document.createElement('span');
    rolIndicator.id = 'rolUsuario';
    rolIndicator.style.cssText = 'margin-right: 12px; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 0.85rem;';
    
    if (esUsuarioAdmin) {
      rolIndicator.textContent = '👑 Administrador';
      rolIndicator.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      rolIndicator.style.color = 'white';
    } else {
      rolIndicator.textContent = '👁️ Solo Lectura';
      rolIndicator.style.background = '#f3f4f6';
      rolIndicator.style.color = '#6b7280';
    }
    
    headerRight.insertBefore(rolIndicator, headerRight.firstChild);
  }
}

// Función para verificar permisos antes de ejecutar acciones
function verificarPermisosAccion(nombreAccion) {
  if (!esUsuarioAdmin) {
    alert(`⛔ Acceso Denegado\n\nSolo el administrador puede ${nombreAccion}.\n\nTu cuenta tiene permisos de solo lectura.`);
    return false;
  }
  return true;
}

// ==================== FORMATEO DE NÚMEROS ====================
// Función para formatear números con separadores de miles
function formatearNumero(valor) {
  // Eliminar todo excepto números
  const numero = valor.replace(/\D/g, '');
  
  // Convertir a número y formatear
  if (numero === '') return '';
  
  return Number(numero).toLocaleString('es-CO');
}

// Función para obtener el valor numérico sin formato
function obtenerValorNumerico(valor) {
  const numero = valor.replace(/\D/g, '');
  return numero === '' ? 0 : Number(numero);
}

// Aplicar formateo a los campos numéricos
function aplicarFormateoNumero(inputId, hiddenId) {
  const input = document.getElementById(inputId);
  const hidden = document.getElementById(hiddenId);
  
  if (!input) return;
  
  input.addEventListener('input', function(e) {
    const cursorPos = e.target.selectionStart;
    const valorAnterior = e.target.value;
    const longitudAnterior = valorAnterior.length;
    
    // Formatear el valor
    const valorFormateado = formatearNumero(e.target.value);
    e.target.value = valorFormateado;
    
    // Guardar el valor numérico en el campo oculto
    if (hidden) {
      hidden.value = obtenerValorNumerico(valorFormateado);
    }
    
    // Ajustar posición del cursor
    const longitudNueva = valorFormateado.length;
    const diferencia = longitudNueva - longitudAnterior;
    const nuevaPosicion = cursorPos + diferencia;
    
    e.target.setSelectionRange(nuevaPosicion, nuevaPosicion);
  });
  
  // Formatear también al salir del campo (blur)
  input.addEventListener('blur', function(e) {
    if (e.target.value === '') {
      e.target.value = '0';
      if (hidden) hidden.value = '0';
    }
  });
  
  // Limpiar al enfocar si es 0
  input.addEventListener('focus', function(e) {
    if (e.target.value === '0') {
      e.target.value = '';
      if (hidden) hidden.value = '0';
    }
  });
}

// Inicializar formateo cuando el DOM esté listo
window.addEventListener('DOMContentLoaded', () => {
  aplicarFormateoNumero('ofrendaSolidaria', 'ofrendaSolidariaValue');
  aplicarFormateoNumero('aporteIndividual', 'aporteIndividualValue');
  aplicarFormateoNumero('egresoMonto', 'egresoMontoValue'); // 🆕 v3.1: Formateo para egresos
  
  // Establecer fecha actual por defecto
  const fechaInput = document.getElementById('fecha');
  if(fechaInput){
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.value = hoy;
  }
  
  // 🆕 v3.1: Fecha por defecto para egresos
  const fechaEgreso = document.getElementById('egresoFecha');
  if(fechaEgreso){
    const hoy = new Date().toISOString().split('T')[0];
    fechaEgreso.value = hoy;
  }
});

// ==================== AUTENTICACIÓN ====================
// Verificar autenticación
onAuthStateChanged(auth, user => {
  if (!user) {
    if (!location.pathname.endsWith('index.html') && !location.pathname.endsWith('/')) {
      window.location.href = 'index.html';
    }
  } else {
    console.log('Usuario autenticado:', user.email);
    // Verificar permisos del usuario
    verificarPermisos(user.email);
  }
});

// Cerrar sesión
window.cerrarSesion = async function(){
  try{
    await signOut(auth);
    window.location.href = 'index.html';
  }catch(e){
    console.error('Error cerrando sesión', e);
    alert('❌ Error al cerrar sesión');
  }
}

// ==================== TOGGLE TIPO DE DONACIÓN ====================
// Toggle para cambiar entre Congregación y Aporte Personal
window.toggleTipoDonacion = function(){
  const checkbox = document.getElementById('esAportePersonal');
  const seccionCongregacion = document.getElementById('seccionCongregacion');
  const seccionAportePersonal = document.getElementById('seccionAportePersonal');
  
  if(checkbox && seccionCongregacion && seccionAportePersonal){
    if(checkbox.checked){
      // Es aporte personal
      seccionCongregacion.style.display = 'none';
      seccionAportePersonal.style.display = 'block';
      
      // Limpiar solo campos específicos de congregación (pastor y ofrenda solidaria)
      document.getElementById('nombrePastor').value = '';
      document.getElementById('ofrendaSolidaria').value = '0';
      document.getElementById('ofrendaSolidariaValue').value = '0';
    } else {
      // Es congregación
      seccionCongregacion.style.display = 'block';
      seccionAportePersonal.style.display = 'none';
      
      // Limpiar campos de aporte personal
      document.getElementById('aportePersonalCongregacion').value = '';
      document.getElementById('aportePersonalNombre').value = '';
      document.getElementById('aporteIndividual').value = '0';
      document.getElementById('aporteIndividualValue').value = '0';
      document.getElementById('foto').value = '';
      document.getElementById('previewContainer').style.display = 'none';
    }
  }
}

// Toggle para mostrar/ocultar aporte personal (ya no se usa, pero lo dejamos por compatibilidad)
window.toggleAportePersonal = function(){
  toggleTipoDonacion();
}

// ==================== PREVIEW FOTO ====================
// Preview de la foto
const fotoInput = document.getElementById('foto');
if(fotoInput){
  fotoInput.addEventListener('change', function(e){
    const file = e.target.files[0];
    if(file){
      const reader = new FileReader();
      reader.onload = function(e){
        const preview = document.getElementById('preview');
        const container = document.getElementById('previewContainer');
        if(preview && container){
          preview.src = e.target.result;
          container.style.display = 'block';
        }
      }
      reader.readAsDataURL(file);
    }
  });
}

// ==================== GUARDAR DONACIÓN ====================
// Guardar donación
window.guardarDonacion = async function(){
  // Verificar permisos
  if (!verificarPermisosAccion('registrar donaciones')) {
    return;
  }
  
  // Deshabilitar botón para evitar doble clic
  const btnGuardar = event.target;
  const textoOriginal = btnGuardar.textContent;
  btnGuardar.disabled = true;
  btnGuardar.textContent = '⏳ Guardando...';
  
  try{
    // Obtener valores del formulario
    const fecha = document.getElementById('fecha').value;
    const esAportePersonal = document.getElementById('esAportePersonal').checked;
    
    // Validar fecha
    if(!fecha){
      alert('⚠️ Seleccione una fecha');
      btnGuardar.disabled = false;
      btnGuardar.textContent = textoOriginal;
      return;
    }

    // Calcular día de la semana
    const [anio, mes, dia] = fecha.split("-");
    const fechaObj = new Date(anio, mes - 1, dia);
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const diaSemana = dias[fechaObj.getDay()];

    // Objeto base de donación
    const donacion = {
      fecha,
      diaSemana,
      tieneAportePersonal: esAportePersonal,
      createdAt: new Date().toISOString()
    };

    if(esAportePersonal){
      // Es un aporte personal
      const aportePersonalCongregacion = document.getElementById('aportePersonalCongregacion').value;
      const aportePersonalNombre = document.getElementById('aportePersonalNombre').value;
      const aporteIndividual = obtenerValorNumerico(document.getElementById('aporteIndividual').value);
      
      // Validaciones
      if(!aportePersonalCongregacion || !aportePersonalNombre){
        alert('⚠️ Complete todos los campos requeridos para el aporte personal');
        btnGuardar.disabled = false;
        btnGuardar.textContent = textoOriginal;
        return;
      }

      if(!aporteIndividual || aporteIndividual <= 0){
        alert('⚠️ Ingrese un monto válido para el aporte individual');
        btnGuardar.disabled = false;
        btnGuardar.textContent = textoOriginal;
        return;
      }

      // Agregar datos de aporte personal
      donacion.nombreCongregacion = aportePersonalCongregacion.trim();
      donacion.aportePersonal = aportePersonalNombre.trim();
      donacion.aporteIndividual = aporteIndividual;
      donacion.ofrendaSolidaria = 0;
      donacion.nombrePastor = '';

      // Subir foto si existe
      const fotoFile = document.getElementById('foto').files[0];
      if(fotoFile){
        btnGuardar.textContent = '📤 Subiendo foto...';
        
        const timestamp = Date.now();
        const nombreArchivo = `${timestamp}_${fotoFile.name}`;
        const storageRef = ref(storage, `donaciones/${nombreArchivo}`);
        
        await uploadBytes(storageRef, fotoFile);
        const fotoURL = await getDownloadURL(storageRef);
        
        donacion.foto = fotoURL;
        donacion.fotoPath = `donaciones/${nombreArchivo}`;
        
        console.log('Foto subida:', fotoURL);
      }
    } else {
      // Es una donación de congregación
      const nombreCongregacion = document.getElementById('nombreCongregacion').value;
      const nombrePastor = document.getElementById('nombrePastor').value;
      const ofrendaSolidaria = obtenerValorNumerico(document.getElementById('ofrendaSolidaria').value);

      // Validaciones
      if(!nombreCongregacion || !nombrePastor){
        alert('⚠️ Complete todos los campos requeridos');
        btnGuardar.disabled = false;
        btnGuardar.textContent = textoOriginal;
        return;
      }

      if(!ofrendaSolidaria || ofrendaSolidaria <= 0){
        alert('⚠️ Ingrese un monto válido para la ofrenda solidaria');
        btnGuardar.disabled = false;
        btnGuardar.textContent = textoOriginal;
        return;
      }

      // Agregar datos de congregación
      donacion.nombreCongregacion = nombreCongregacion.trim();
      donacion.nombrePastor = nombrePastor.trim();
      donacion.ofrendaSolidaria = ofrendaSolidaria;
      donacion.aporteIndividual = 0;
      donacion.aportePersonal = '';
    }

    // Guardar en Firestore
    btnGuardar.textContent = '💾 Guardando...';
    await addDoc(collection(db, 'Donaciones'), donacion);
    
    alert('✅ Donación guardada correctamente');
    
    // Limpiar formulario
    limpiarFormulario();
    
  } catch(err) {
    console.error('Error guardando donación:', err);
    alert('❌ Error al guardar: ' + err.message);
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = textoOriginal;
  }
}

// ==================== LIMPIAR FORMULARIO ====================
// Limpiar formulario después de guardar
function limpiarFormulario(){
  // Restablecer checkbox
  document.getElementById('esAportePersonal').checked = false;
  
  // Restablecer fecha a hoy
  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById('fecha').value = hoy;
  
  // Limpiar campos de congregación
  document.getElementById('nombreCongregacion').value = '';
  document.getElementById('nombrePastor').value = '';
  document.getElementById('ofrendaSolidaria').value = '0';
  document.getElementById('ofrendaSolidariaValue').value = '0';
  
  // Limpiar campos de aporte personal
  document.getElementById('aportePersonalCongregacion').value = '';
  document.getElementById('aportePersonalNombre').value = '';
  document.getElementById('aporteIndividual').value = '0';
  document.getElementById('aporteIndividualValue').value = '0';
  document.getElementById('foto').value = '';
  document.getElementById('previewContainer').style.display = 'none';
  
  // Mostrar sección correcta
  document.getElementById('seccionCongregacion').style.display = 'block';
  document.getElementById('seccionAportePersonal').style.display = 'none';
}

// ==================== CARGAR DONACIONES ====================
// Cargar donaciones en tiempo real
const listaDonaciones = document.getElementById('listaDonaciones');
if(listaDonaciones){
  const q = query(collection(db, 'Donaciones'), orderBy('fecha', 'desc'));
  
  onSnapshot(q, (snapshot) => {
    let html = '<div class="donaciones-grid">';
    
    let totalOfrendas = 0;
    let totalAportes = 0;
    let conteo = 0;
    let cantidadOfrendas = 0;
    let cantidadAportes = 0;
    
    // Objeto para almacenar totales por congregación
    const congregaciones = {};
    
    // NUEVO v3.0: Resetear y llenar array global de donaciones con IDs
    donacionesGlobal = [];
    let donacionID = 0;

    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      conteo++;
      donacionID++;  // ID numérico secuencial

      const ofrendaSolidaria = Number(d.ofrendaSolidaria || 0);
      const aporteIndividual = Number(d.aporteIndividual || 0);
      const total = ofrendaSolidaria + aporteIndividual;

      // Acumular totales generales
      totalOfrendas += ofrendaSolidaria;
      totalAportes += aporteIndividual;
      
      if (ofrendaSolidaria > 0) cantidadOfrendas++;
      if (aporteIndividual > 0) cantidadAportes++;

      // Acumular por congregación
      const nombreCong = d.nombreCongregacion || 'Sin congregación';
      if (!congregaciones[nombreCong]) {
        congregaciones[nombreCong] = {
          totalSolidario: 0,
          totalIndividual: 0,
          cantidadSolidario: 0,
          cantidadIndividual: 0,
          personas: [],  // NUEVO v3.0: Lista de personas que aportaron
          donacionesIDs: []  // NUEVO v3.0: IDs de donaciones para relacionar
        };
      }
      
      if (ofrendaSolidaria > 0) {
        congregaciones[nombreCong].totalSolidario += ofrendaSolidaria;
        congregaciones[nombreCong].cantidadSolidario++;
        congregaciones[nombreCong].donacionesIDs.push(donacionID);
      }
      
      if (aporteIndividual > 0) {
        congregaciones[nombreCong].totalIndividual += aporteIndividual;
        congregaciones[nombreCong].cantidadIndividual++;
        congregaciones[nombreCong].personas.push({
          id: donacionID,
          nombre: d.aportePersonal || 'Sin nombre',
          monto: aporteIndividual
        });
        congregaciones[nombreCong].donacionesIDs.push(donacionID);
      }
      
      // NUEVO v3.0: Guardar en array global para búsqueda rápida
      donacionesGlobal.push({
        id: donacionID,
        firestoreId: docSnap.id,
        data: d,
        congregacion: nombreCong,
        persona: d.aportePersonal || '',
        total: total
      });

      // Renderizar tarjeta
      if(d.tieneAportePersonal){
        // Tarjeta de aporte personal
        html += `
          <div id="donacion-${donacionID}" class="donacion-card aporte-personal-card">
            <div class="donacion-header">
              <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                  <span class="donacion-id-badge">#${donacionID}</span>
                  <h3 style="margin: 0;">👤 ${d.aportePersonal || 'Aporte Personal'}</h3>
                </div>
                <p class="muted">⛪ ${d.nombreCongregacion || 'Sin congregación'}</p>
                <p class="muted">📅 ${d.diaSemana || ''} • ${d.fecha}</p>
              </div>
              <div class="donacion-total">$${aporteIndividual.toLocaleString('es-CO')}</div>
            </div>
            
            <div class="donacion-body">
              <div class="info-row">
                <span class="label">💰 Aporte Individual:</span>
                <span>$${aporteIndividual.toLocaleString('es-CO')}</span>
              </div>
              ${d.foto ? `
                <div style="margin-top:10px">
                  <img src="${d.foto}" alt="Comprobante" class="comprobante-foto" onclick="verFoto('${d.foto}')">
                </div>
              ` : ''}
            </div>
            
            <div class="donacion-actions" style="display: ${esUsuarioAdmin ? 'flex' : 'none'}">
              <button class="btn edit" onclick="editarDonacion('${docSnap.id}')">✏️ Editar</button>
              <button class="btn delete" onclick="eliminarDonacion('${docSnap.id}', '${d.fotoPath || ''}')">🗑️ Eliminar</button>
            </div>
          </div>
        `;
      } else {
        // Donación normal (congregación)
        html += `
          <div id="donacion-${donacionID}" class="donacion-card">
            <div class="donacion-header">
              <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                  <span class="donacion-id-badge">#${donacionID}</span>
                  <h3 style="margin: 0;">⛪ ${d.nombreCongregacion}</h3>
                </div>
                <p class="muted">📅 ${d.diaSemana || ''} • ${d.fecha}</p>
              </div>
              <div class="donacion-total">$${total.toLocaleString('es-CO')}</div>
            </div>
            
            <div class="donacion-body">
              <div class="info-row">
                <span class="label">👨‍🏫 Pastor:</span>
                <span>${d.nombrePastor}</span>
              </div>
              
              <div class="info-row">
                <span class="label">💵 Ofrenda Solidaria:</span>
                <span>$${ofrendaSolidaria.toLocaleString('es-CO')}</span>
              </div>
            </div>
            
            <div class="donacion-actions" style="display: ${esUsuarioAdmin ? 'flex' : 'none'}">
              <button class="btn edit" onclick="editarDonacion('${docSnap.id}')">✏️ Editar</button>
              <button class="btn delete" onclick="eliminarDonacion('${docSnap.id}', '${d.fotoPath || ''}')">🗑️ Eliminar</button>
            </div>
          </div>
        `;
      }
    });

    html += '</div>';
    listaDonaciones.innerHTML = html;
    
    // Actualizar totales
    actualizarTotales(totalOfrendas, totalAportes, totalOfrendas + totalAportes, conteo, cantidadOfrendas, cantidadAportes, congregaciones);
  });
}

// ==================== ACTUALIZAR TOTALES ====================
// Función para actualizar los totales en el resumen
function actualizarTotales(ofrendas, aportes, general, cantidad, cantOfrendas, cantAportes, congregaciones){
  const totalOfrendasEl = document.getElementById('totalOfrendas');
  const totalAportesEl = document.getElementById('totalAportes');
  const totalGeneralEl = document.getElementById('totalGeneral');
  const totalDonacionesEl = document.getElementById('totalDonaciones');
  const cantidadOfrendasEl = document.getElementById('cantidadOfrendas');
  const cantidadAportesEl = document.getElementById('cantidadAportes');
  
  if(totalOfrendasEl) totalOfrendasEl.textContent = `$${ofrendas.toLocaleString('es-CO')}`;
  if(totalAportesEl) totalAportesEl.textContent = `$${aportes.toLocaleString('es-CO')}`;
  if(totalGeneralEl) totalGeneralEl.textContent = `$${general.toLocaleString('es-CO')}`;
  if(totalDonacionesEl) totalDonacionesEl.textContent = `${cantidad} donaciones`;
  if(cantidadOfrendasEl) cantidadOfrendasEl.textContent = `${cantOfrendas} aportes`;
  if(cantidadAportesEl) cantidadAportesEl.textContent = `${cantAportes} aportes`;
  
  // 🆕 v3.1: Actualizar totales de egresos y saldo
  let totalEgresos = 0;
  egresosGlobal.forEach(e => {
    totalEgresos += e.data.monto || 0;
  });
  
  const saldo = general - totalEgresos;
  
  const totalEgresosEl = document.getElementById('totalEgresos');
  const cantidadEgresosEl = document.getElementById('cantidadEgresos');
  const saldoDisponibleEl = document.getElementById('saldoDisponible');
  
  if(totalEgresosEl) totalEgresosEl.textContent = `$${totalEgresos.toLocaleString('es-CO')}`;
  if(cantidadEgresosEl) cantidadEgresosEl.textContent = `${egresosGlobal.length} egresos`;
  if(saldoDisponibleEl) {
    saldoDisponibleEl.textContent = `$${saldo.toLocaleString('es-CO')}`;
    // Cambiar color si es negativo
    if(saldo < 0){
      saldoDisponibleEl.style.color = '#dc2626';
    } else {
      saldoDisponibleEl.style.color = '#10b981';
    }
  }
  
  // Guardar congregaciones globalmente
  congregacionesGlobal = congregaciones || {};
  
  // Actualizar tabla de congregaciones con el filtro actual
  actualizarTablaCongregaciones();
}

// ==================== FILTRAR CONGREGACIONES ====================
// Función para filtrar congregaciones según el tipo seleccionado
window.filtrarCongregaciones = function(tipo) {
  filtroActual = tipo;
  
  // Actualizar botones activos
  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.classList.remove('active');
    if(btn.getAttribute('data-filtro') === tipo) {
      btn.classList.add('active');
    }
  });
  
  // Actualizar tabla
  actualizarTablaCongregaciones();
}

// ==================== ACTUALIZAR TABLA CONGREGACIONES ====================
// Función para actualizar la tabla de congregaciones según el filtro
function actualizarTablaCongregaciones() {
  const tablaCongregaciones = document.getElementById('tablaCongregaciones');
  if(!tablaCongregaciones || !congregacionesGlobal) return;
  
  let htmlTabla = '<div class="tabla-congregaciones-container">';
  htmlTabla += '<table class="tabla-congregaciones">';
  
  // Definir encabezados según el filtro
  if(filtroActual === 'todos') {
    htmlTabla += `
      <thead>
        <tr>
          <th>ID</th>
          <th>Congregación</th>
          <th>Donante</th>
          <th>Ofrendas Solidarias</th>
          <th>Cant.</th>
          <th>Aportes Individuales</th>
          <th>Cant.</th>
          <th>Total</th>
        </tr>
      </thead>
    `;
  } else if(filtroActual === 'ofrendas') {
    htmlTabla += `
      <thead>
        <tr>
          <th>ID</th>
          <th>Congregación</th>
          <th>Pastor</th>
          <th>Ofrendas Solidarias</th>
          <th>Cant.</th>
        </tr>
      </thead>
    `;
  } else if(filtroActual === 'aportes') {
    htmlTabla += `
      <thead>
        <tr>
          <th>ID</th>
          <th>Congregación</th>
          <th>Donante</th>
          <th>Aportes Individuales</th>
          <th>Cant.</th>
        </tr>
      </thead>
    `;
  }
  
  htmlTabla += '<tbody>';
  
  // Ordenar congregaciones alfabéticamente
  const congregacionesOrdenadas = Object.keys(congregacionesGlobal).sort();
  
  // Filtrar y mostrar según selección
  congregacionesOrdenadas.forEach(nombre => {
    const cong = congregacionesGlobal[nombre];
    const totalCong = cong.totalSolidario + cong.totalIndividual;
    
    // Aplicar filtros
    if(filtroActual === 'ofrendas' && cong.totalSolidario === 0) return;
    if(filtroActual === 'aportes' && cong.totalIndividual === 0) return;
    
    if(filtroActual === 'todos') {
      // Generar lista de IDs clickeables y donantes (solo nombres, sin duplicar IDs)
      const todosLosIDs = cong.donacionesIDs.map(id => `<a href="#donacion-${id}" class="id-link" onclick="scrollToDonacion(${id})">#${id}</a>`).join(', ');
      const listaDonantes = cong.personas.length > 0 
        ? cong.personas.map(p => p.nombre).join(', ')
        : '-';
      
      htmlTabla += `
        <tr>
          <td class="cong-ids">${todosLosIDs || '-'}</td>
          <td class="cong-nombre">${nombre}</td>
          <td class="cong-donante" title="${listaDonantes}">${listaDonantes}</td>
          <td class="cong-valor">$${cong.totalSolidario.toLocaleString('es-CO')}</td>
          <td class="cong-cantidad">${cong.cantidadSolidario}</td>
          <td class="cong-valor">$${cong.totalIndividual.toLocaleString('es-CO')}</td>
          <td class="cong-cantidad">${cong.cantidadIndividual}</td>
          <td class="cong-total">$${totalCong.toLocaleString('es-CO')}</td>
        </tr>
      `;
    } else if(filtroActual === 'ofrendas') {
      // Para ofrendas mostrar pastor e IDs clickeables
      const pastor = donacionesGlobal.find(d => d.congregacion === nombre && d.data.nombrePastor)?.data.nombrePastor || '-';
      const ids = cong.donacionesIDs.filter((id, index, self) => {
        // Filtrar solo IDs de ofrendas solidarias
        const donacion = donacionesGlobal.find(d => d.id === id);
        return donacion && donacion.data.ofrendaSolidaria > 0;
      }).map(id => `<a href="#donacion-${id}" class="id-link" onclick="scrollToDonacion(${id})">#${id}</a>`).join(', ');
      
      htmlTabla += `
        <tr>
          <td class="cong-ids">${ids || '-'}</td>
          <td class="cong-nombre">${nombre}</td>
          <td class="cong-donante">${pastor}</td>
          <td class="cong-valor">$${cong.totalSolidario.toLocaleString('es-CO')}</td>
          <td class="cong-cantidad">${cong.cantidadSolidario}</td>
        </tr>
      `;
    } else if(filtroActual === 'aportes') {
      // Para aportes mostrar donantes (solo nombres) e IDs clickeables
      const donantes = cong.personas.map(p => p.nombre).join(', ');
      const ids = cong.personas.map(p => `<a href="#donacion-${p.id}" class="id-link" onclick="scrollToDonacion(${p.id})">#${p.id}</a>`).join(', ');
      
      htmlTabla += `
        <tr>
          <td class="cong-ids">${ids || '-'}</td>
          <td class="cong-nombre">${nombre}</td>
          <td class="cong-donante" title="${donantes}">${donantes}</td>
          <td class="cong-valor">$${cong.totalIndividual.toLocaleString('es-CO')}</td>
          <td class="cong-cantidad">${cong.cantidadIndividual}</td>
        </tr>
      `;
    }
  });
  
  htmlTabla += '</tbody></table></div>';
  tablaCongregaciones.innerHTML = htmlTabla;
}

// ==================== VER FOTO ====================
// Ver foto en grande
window.verFoto = function(url){
  window.open(url, '_blank');
}

// ==================== EDITAR DONACIÓN ====================
// Editar donación
window.editarDonacion = async function(id){
  // Verificar permisos
  if (!verificarPermisosAccion('editar donaciones')) {
    return;
  }
  
  try{
    const ref = doc(db, 'Donaciones', id);
    const snap = await getDoc(ref);
    
    if(!snap.exists()){
      alert('❌ Donación no encontrada');
      return;
    }

    const data = snap.data();
    
    // Pedir nuevos valores
    const fecha = prompt('Fecha (YYYY-MM-DD):', data.fecha);
    if(fecha === null) return;
    
    const nombreCongregacion = prompt('Nombre Congregación:', data.nombreCongregacion);
    if(nombreCongregacion === null) return;
    
    const nombrePastor = prompt('Nombre Pastor:', data.nombrePastor);
    if(nombrePastor === null) return;
    
    const ofrendaSolidaria = prompt('Ofrenda Solidaria:', data.ofrendaSolidaria || 0);
    if(ofrendaSolidaria === null) return;

    // Calcular día de la semana
    const [anio, mes, dia] = fecha.split('-');
    const fechaObj = new Date(anio, mes - 1, dia);
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const diaSemana = dias[fechaObj.getDay()];

    const updateData = {
      fecha,
      diaSemana,
      nombreCongregacion: nombreCongregacion.trim(),
      nombrePastor: nombrePastor.trim(),
      ofrendaSolidaria: Number(ofrendaSolidaria)
    };

    // Si tiene aporte personal, permitir editarlo
    if(data.tieneAportePersonal){
      const aportePersonal = prompt('Nombre Persona (Aporte Personal):', data.aportePersonal || '');
      if(aportePersonal !== null){
        updateData.aportePersonal = aportePersonal.trim();
      }
      
      const aporteIndividual = prompt('Aporte Individual:', data.aporteIndividual || 0);
      if(aporteIndividual !== null){
        updateData.aporteIndividual = Number(aporteIndividual);
      }
    }

    await updateDoc(ref, updateData);
    alert('✅ Donación actualizada');

  }catch(err){
    console.error(err);
    alert('❌ Error al editar: ' + err.message);
  }
}

// ==================== ELIMINAR DONACIÓN ====================
// Eliminar donación
window.eliminarDonacion = async function(id, fotoPath){
  // Verificar permisos
  if (!verificarPermisosAccion('eliminar donaciones')) {
    return;
  }
  
  try{
    const conf = confirm('⚠️ ¿Está seguro de eliminar esta donación?');
    if(!conf) return;

    // Eliminar foto del storage si existe
    if(fotoPath){
      try{
        const fotoRef = ref(storage, fotoPath);
        await deleteObject(fotoRef);
        console.log('Foto eliminada del storage');
      }catch(err){
        console.warn('No se pudo eliminar la foto:', err);
      }
    }

    // Eliminar documento de Firestore
    const docRef = doc(db, 'Donaciones', id);
    await deleteDoc(docRef);
    
    alert('✅ Donación eliminada');

  }catch(err){
    console.error(err);
    alert('❌ Error al eliminar: ' + err.message);
  }
}

// ==================== SCROLL A DONACIÓN ====================
// Función para hacer scroll suave a una tarjeta específica
window.scrollToDonacion = function(donacionID) {
  // Prevenir comportamiento por defecto del link
  event.preventDefault();
  
  // Buscar el elemento con ese ID
  const elemento = document.getElementById(`donacion-${donacionID}`);
  
  if (elemento) {
    // Hacer scroll suave
    elemento.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Agregar efecto de highlight temporal
    elemento.classList.add('highlight-donacion');
    
    // Remover el highlight después de 2 segundos
    setTimeout(() => {
      elemento.classList.remove('highlight-donacion');
    }, 2000);
  } else {
    console.warn(`No se encontró la donación con ID: ${donacionID}`);
  }
}

// ==================== 🆕 v3.1: GUARDAR EGRESO ====================
window.guardarEgreso = async function(){
  if (!verificarPermisosAccion('registrar egresos')) {
    return;
  }
  
  try{
    const fecha = document.getElementById('egresoFecha').value;
    const concepto = document.getElementById('egresoConcepto').value.trim();
    const descripcion = document.getElementById('egresoDescripcion').value.trim();
    const montoValue = document.getElementById('egresoMontoValue').value;
    const monto = Number(montoValue);
    
    if(!fecha){
      alert('⚠️ Ingrese la fecha del egreso');
      return;
    }
    
    if(!concepto){
      alert('⚠️ Ingrese el concepto del egreso');
      return;
    }
    
    if(monto <= 0){
      alert('⚠️ Ingrese un monto válido');
      return;
    }

    const [anio, mes, dia] = fecha.split('-');
    const fechaObj = new Date(anio, mes - 1, dia);
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const diaSemana = dias[fechaObj.getDay()];

    const dataToSave = {
      fecha,
      diaSemana,
      concepto,
      descripcion,
      monto,
      creadoEn: new Date().toISOString()
    };

    await addDoc(collection(db, 'Egresos'), dataToSave);
    alert('✅ Egreso registrado correctamente');

    document.getElementById('egresoFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('egresoConcepto').value = '';
    document.getElementById('egresoDescripcion').value = '';
    document.getElementById('egresoMonto').value = '0';
    document.getElementById('egresoMontoValue').value = '0';

  }catch(err){
    console.error('Error guardando egreso:', err);
    alert('❌ Error al guardar egreso: ' + err.message);
  }
}

// ==================== 🆕 v3.1: CARGAR EGRESOS ====================
const qEgresos = query(collection(db, 'Egresos'), orderBy('fecha', 'desc'));
onSnapshot(qEgresos, snap => {
  egresosGlobal = [];
  let totalEgresos = 0;

  snap.forEach(docSnap => {
    const data = docSnap.data();
    egresosGlobal.push({
      id: docSnap.id,
      data: data
    });
    totalEgresos += data.monto || 0;
  });

  console.log(`📉 ${egresosGlobal.length} egresos cargados`);
  
  mostrarEgresos();
  actualizarResumenGeneral();
});

function mostrarEgresos() {
  const container = document.getElementById('listaEgresos');
  if(!container) return;

  if(egresosGlobal.length === 0){
    container.innerHTML = '<p style="text-align:center;color:#6b7280;padding:40px">No hay egresos registrados</p>';
    return;
  }

  let html = '<div class="donaciones-grid">';

  egresosGlobal.forEach(egreso => {
    const d = egreso.data;
    const puedeEditar = esUsuarioAdmin;
    
    html += `
      <div class="donacion-card egreso-card">
        <div class="donacion-header egreso-header">
          <div>
            <h3>💸 ${d.concepto}</h3>
            <p class="muted">${d.diaSemana}, ${d.fecha}</p>
          </div>
          <div class="donacion-total">$${d.monto.toLocaleString('es-CO')}</div>
        </div>
        <div class="donacion-body">
          ${d.descripcion ? `
            <div class="info-row">
              <span class="label">📝 Descripción</span>
              <span>${d.descripcion}</span>
            </div>
          ` : ''}
        </div>
        ${puedeEditar ? `
        <div class="donacion-actions">
          <button class="btn edit" onclick="editarEgreso('${egreso.id}')">✏️ Editar</button>
          <button class="btn delete" onclick="eliminarEgreso('${egreso.id}')">🗑️ Eliminar</button>
        </div>
        ` : ''}
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

// ==================== 🆕 v3.1: EDITAR EGRESO ====================
window.editarEgreso = async function(id){
  if (!verificarPermisosAccion('editar egresos')) {
    return;
  }
  
  try{
    const ref = doc(db, 'Egresos', id);
    const snap = await getDoc(ref);
    
    if(!snap.exists()){
      alert('❌ Egreso no encontrado');
      return;
    }

    const data = snap.data();
    
    const fecha = prompt('Fecha (YYYY-MM-DD):', data.fecha);
    if(fecha === null) return;
    
    const concepto = prompt('Concepto:', data.concepto);
    if(concepto === null) return;
    
    const descripcion = prompt('Descripción (opcional):', data.descripcion || '');
    if(descripcion === null) return;
    
    const monto = prompt('Monto:', data.monto || 0);
    if(monto === null) return;

    const [anio, mes, dia] = fecha.split('-');
    const fechaObj = new Date(anio, mes - 1, dia);
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const diaSemana = dias[fechaObj.getDay()];

    const updateData = {
      fecha,
      diaSemana,
      concepto: concepto.trim(),
      descripcion: descripcion.trim(),
      monto: Number(monto)
    };

    await updateDoc(ref, updateData);
    alert('✅ Egreso actualizado');

  }catch(err){
    console.error(err);
    alert('❌ Error al editar: ' + err.message);
  }
}

// ==================== 🆕 v3.1: ELIMINAR EGRESO ====================
window.eliminarEgreso = async function(id){
  if (!verificarPermisosAccion('eliminar egresos')) {
    return;
  }
  
  try{
    const conf = confirm('⚠️ ¿Está seguro de eliminar este egreso?');
    if(!conf) return;

    const docRef = doc(db, 'Egresos', id);
    await deleteDoc(docRef);
    
    alert('✅ Egreso eliminado');

  }catch(err){
    console.error(err);
    alert('❌ Error al eliminar: ' + err.message);
  }
}