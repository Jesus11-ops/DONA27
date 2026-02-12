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

// Variables globales para totales (necesarias para actualizar el resumen)
let totalesGlobales = {
  ofrendas: 0,
  aportes: 0,
  general: 0,
  cantidad: 0,
  cantOfrendas: 0,
  cantAportes: 0
};

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
        const previewContainer = document.getElementById('previewContainer');
        if(preview && previewContainer){
          preview.src = e.target.result;
          previewContainer.style.display = 'block';
        }
      }
      reader.readAsDataURL(file);
    }
  });
}

// ==================== GUARDAR DONACIÓN ====================
window.guardarDonacion = async function(){
  if (!verificarPermisosAccion('registrar donaciones')) {
    return;
  }
  
  try{
    const fecha = document.getElementById('fecha').value;
    const esAportePersonal = document.getElementById('esAportePersonal').checked;
    
    if(!fecha){
      alert('⚠️ Ingrese la fecha');
      return;
    }

    // Calcular día de la semana
    const [anio, mes, dia] = fecha.split('-');
    const fechaObj = new Date(anio, mes - 1, dia);
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const diaSemana = dias[fechaObj.getDay()];

    let dataToSave = {
      fecha,
      diaSemana,
      tieneAportePersonal: esAportePersonal,
      creadoEn: new Date().toISOString()
    };

    if (esAportePersonal) {
      // Es aporte personal
      const congregacion = document.getElementById('aportePersonalCongregacion').value.trim();
      const nombrePersona = document.getElementById('aportePersonalNombre').value.trim();
      const aporteIndividualValue = document.getElementById('aporteIndividualValue').value;
      const aporteIndividual = Number(aporteIndividualValue);

      if(!congregacion){
        alert('⚠️ Ingrese el nombre de la congregación');
        return;
      }

      if(!nombrePersona){
        alert('⚠️ Ingrese el nombre de la persona');
        return;
      }

      if(aporteIndividual <= 0){
        alert('⚠️ Ingrese un monto válido');
        return;
      }

      dataToSave.nombreCongregacion = congregacion;
      dataToSave.aportePersonal = nombrePersona;
      dataToSave.aporteIndividual = aporteIndividual;
      dataToSave.ofrendaSolidaria = 0;
      dataToSave.nombrePastor = '';

      // Manejar foto si existe
      const fotoFile = document.getElementById('foto').files[0];
      if(fotoFile){
        const timestamp = Date.now();
        const storageRef = ref(storage, `comprobantes/${timestamp}_${fotoFile.name}`);
        await uploadBytes(storageRef, fotoFile);
        const fotoURL = await getDownloadURL(storageRef);
        dataToSave.fotoURL = fotoURL;
        dataToSave.fotoPath = `comprobantes/${timestamp}_${fotoFile.name}`;
      }

    } else {
      // Es congregación
      const nombreCongregacion = document.getElementById('nombreCongregacion').value.trim();
      const nombrePastor = document.getElementById('nombrePastor').value.trim();
      const ofrendaSolidariaValue = document.getElementById('ofrendaSolidariaValue').value;
      const ofrendaSolidaria = Number(ofrendaSolidariaValue);

      if(!nombreCongregacion){
        alert('⚠️ Ingrese el nombre de la congregación');
        return;
      }

      if(!nombrePastor){
        alert('⚠️ Ingrese el nombre del pastor');
        return;
      }

      if(ofrendaSolidaria <= 0){
        alert('⚠️ Ingrese un monto válido');
        return;
      }

      dataToSave.nombreCongregacion = nombreCongregacion;
      dataToSave.nombrePastor = nombrePastor;
      dataToSave.ofrendaSolidaria = ofrendaSolidaria;
      dataToSave.aportePersonal = '';
      dataToSave.aporteIndividual = 0;
    }

    await addDoc(collection(db, 'Donaciones'), dataToSave);
    alert('✅ Donación guardada correctamente');

    // Limpiar formulario
    document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('esAportePersonal').checked = false;
    document.getElementById('nombreCongregacion').value = '';
    document.getElementById('nombrePastor').value = '';
    document.getElementById('ofrendaSolidaria').value = '0';
    document.getElementById('ofrendaSolidariaValue').value = '0';
    document.getElementById('aportePersonalCongregacion').value = '';
    document.getElementById('aportePersonalNombre').value = '';
    document.getElementById('aporteIndividual').value = '0';
    document.getElementById('aporteIndividualValue').value = '0';
    document.getElementById('foto').value = '';
    document.getElementById('previewContainer').style.display = 'none';
    
    // Resetear vista a congregación
    document.getElementById('seccionCongregacion').style.display = 'block';
    document.getElementById('seccionAportePersonal').style.display = 'none';

  }catch(err){
    console.error('Error guardando donación:', err);
    alert('❌ Error al guardar: ' + err.message);
  }
}

// ==================== CARGAR DONACIONES ====================
// Cargar donaciones en tiempo real desde Firestore
function cargarDonaciones(){
  const listaDonaciones = document.getElementById('listaDonaciones');
  if(!listaDonaciones) return;

  const q = query(collection(db, 'Donaciones'), orderBy('fecha', 'desc'));
  onSnapshot(q, snap => {
    donacionesGlobal = [];
    let totalOfrendas = 0;
    let totalAportes = 0;
    let conteo = 0;
    let cantidadOfrendas = 0;
    let cantidadAportes = 0;
    const congregaciones = {};

    snap.forEach(docSnap => {
      const data = docSnap.data();
      const ofrendaSolidaria = data.ofrendaSolidaria || 0;
      const aporteIndividual = data.aporteIndividual || 0;
      const total = ofrendaSolidaria + aporteIndividual;

      // Guardar donación con ID numérico
      const donacionID = donacionesGlobal.length + 1;
      donacionesGlobal.push({
        id: docSnap.id,
        donacionID: donacionID,
        data: data
      });

      totalOfrendas += ofrendaSolidaria;
      totalAportes += aporteIndividual;
      conteo++;

      if(ofrendaSolidaria > 0) cantidadOfrendas++;
      if(aporteIndividual > 0) cantidadAportes++;

      // Agrupar por congregación
      const nombreCong = data.nombreCongregacion || 'Sin Congregación';
      if(!congregaciones[nombreCong]){
        congregaciones[nombreCong] = { 
          ofrendas: 0, 
          aportes: 0,
          conteo: 0
        };
      }
      congregaciones[nombreCong].ofrendas += ofrendaSolidaria;
      congregaciones[nombreCong].aportes += aporteIndividual;
      congregaciones[nombreCong].conteo++;
    });

    console.log(`📊 ${conteo} donaciones cargadas`);
    
    // Guardar totales globalmente
    totalesGlobales = {
      ofrendas: totalOfrendas,
      aportes: totalAportes,
      general: totalOfrendas + totalAportes,
      cantidad: conteo,
      cantOfrendas: cantidadOfrendas,
      cantAportes: cantidadAportes
    };

    mostrarDonaciones();
    actualizarTotales(totalOfrendas, totalAportes, totalOfrendas + totalAportes, conteo, cantidadOfrendas, cantidadAportes, congregaciones);
  });
}

// Función para mostrar donaciones
function mostrarDonaciones() {
  const listaDonaciones = document.getElementById('listaDonaciones');
  if(!listaDonaciones) return;

  if(donacionesGlobal.length === 0){
    listaDonaciones.innerHTML = '<p style="text-align:center;color:#6b7280;padding:40px">No hay donaciones registradas</p>';
    return;
  }

  let html = '<div class="donaciones-grid">';

  donacionesGlobal.forEach(donacion => {
    const d = donacion.data;
    const donacionID = donacion.donacionID;
    const ofrendaSolidaria = d.ofrendaSolidaria || 0;
    const aporteIndividual = d.aporteIndividual || 0;
    const total = ofrendaSolidaria + aporteIndividual;

    if (d.tieneAportePersonal) {
      // Tarjeta de Aporte Personal
      html += `
        <div class="donacion-card" id="donacion-${donacionID}">
          <div class="donacion-header">
            <div>
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                <span class="donacion-id-badge">#${donacionID}</span>
                <h3 style="margin: 0;">👤 ${d.aportePersonal}</h3>
              </div>
              <p class="muted">📅 ${d.diaSemana || ''} • ${d.fecha}</p>
            </div>
            <div class="donacion-total">$${total.toLocaleString('es-CO')}</div>
          </div>
          
          <div class="donacion-body">
            <div class="info-row">
              <span class="label">⛪ Congregación:</span>
              <span>${d.nombreCongregacion}</span>
            </div>
            
            <div class="info-row">
              <span class="label">💰 Aporte Individual:</span>
              <span>$${aporteIndividual.toLocaleString('es-CO')}</span>
            </div>
            
            ${d.fotoURL ? `
            <div class="info-row">
              <span class="label">📷 Comprobante:</span>
              <a href="${d.fotoURL}" target="_blank" class="link">Ver foto</a>
            </div>
            ` : ''}
          </div>
          
          <div class="donacion-actions" style="display: ${esUsuarioAdmin ? 'flex' : 'none'}">
            <button class="btn edit" onclick="editarDonacion('${donacion.id}')">✏️ Editar</button>
            <button class="btn delete" onclick="eliminarDonacion('${donacion.id}', '${d.fotoPath || ''}')">🗑️ Eliminar</button>
          </div>
        </div>
      `;
    } else {
      // Tarjeta de Congregación
      html += `
        <div class="donacion-card" id="donacion-${donacionID}">
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
            <button class="btn edit" onclick="editarDonacion('${donacion.id}')">✏️ Editar</button>
            <button class="btn delete" onclick="eliminarDonacion('${donacion.id}', '${d.fotoPath || ''}')">🗑️ Eliminar</button>
          </div>
        </div>
      `;
    }
  });

  html += '</div>';
  listaDonaciones.innerHTML = html;
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
  actualizarTotalesEgresos(general);
  
  // Guardar congregaciones globalmente
  congregacionesGlobal = congregaciones || {};
  
  // Actualizar tabla de congregaciones con el filtro actual
  actualizarTablaCongregaciones();
}

// 🆕 v3.1: Función para actualizar totales de egresos
function actualizarTotalesEgresos(totalIngresos) {
  let totalEgresos = 0;
  egresosGlobal.forEach(e => {
    totalEgresos += e.data.monto || 0;
  });
  
  const saldo = totalIngresos - totalEgresos;
  
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
  
  const congregacionesArray = Object.keys(congregacionesGlobal).map(nombre => ({
    nombre,
    ...congregacionesGlobal[nombre],
    total: congregacionesGlobal[nombre].ofrendas + congregacionesGlobal[nombre].aportes
  }));
  
  // Filtrar según el tipo seleccionado
  let congregacionesFiltradas = congregacionesArray;
  if(filtroActual === 'ofrendas') {
    congregacionesFiltradas = congregacionesArray.filter(c => c.ofrendas > 0);
  } else if(filtroActual === 'aportes') {
    congregacionesFiltradas = congregacionesArray.filter(c => c.aportes > 0);
  }
  
  // Ordenar por total descendente
  congregacionesFiltradas.sort((a, b) => b.total - a.total);
  
  if(congregacionesFiltradas.length === 0){
    tablaCongregaciones.innerHTML = '<p style="text-align:center;color:#6b7280;padding:20px">No hay datos para mostrar</p>';
    return;
  }
  
  let html = `
    <div class="tabla-congregaciones">
      <div class="tabla-header">
        <div class="tabla-col">Congregación</div>
        ${filtroActual === 'todos' || filtroActual === 'ofrendas' ? '<div class="tabla-col">Ofrendas</div>' : ''}
        ${filtroActual === 'todos' || filtroActual === 'aportes' ? '<div class="tabla-col">Aportes</div>' : ''}
        <div class="tabla-col">Total</div>
        <div class="tabla-col">Registros</div>
        <div class="tabla-col">Ver</div>
      </div>
  `;
  
  congregacionesFiltradas.forEach((cong, index) => {
    html += `
      <div class="tabla-row ${index % 2 === 0 ? 'even' : ''}">
        <div class="tabla-col"><strong>${cong.nombre}</strong></div>
        ${filtroActual === 'todos' || filtroActual === 'ofrendas' ? `<div class="tabla-col">$${cong.ofrendas.toLocaleString('es-CO')}</div>` : ''}
        ${filtroActual === 'todos' || filtroActual === 'aportes' ? `<div class="tabla-col">$${cong.aportes.toLocaleString('es-CO')}</div>` : ''}
        <div class="tabla-col"><strong>$${cong.total.toLocaleString('es-CO')}</strong></div>
        <div class="tabla-col">${cong.conteo}</div>
        <div class="tabla-col">
          <a href="#" onclick="verDonacionesCongregacion('${cong.nombre}'); return false;" class="link">📋 Ver detalles</a>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  tablaCongregaciones.innerHTML = html;
}

// ==================== VER DONACIONES POR CONGREGACIÓN ====================
// Función para mostrar todas las donaciones de una congregación específica
window.verDonacionesCongregacion = function(nombreCongregacion) {
  // Filtrar donaciones de esa congregación
  const donacionesCong = donacionesGlobal.filter(d => 
    d.data.nombreCongregacion === nombreCongregacion
  );
  
  if(donacionesCong.length === 0) {
    alert('No se encontraron donaciones para esta congregación');
    return;
  }
  
  // Hacer scroll a la primera donación de esa congregación
  const primeraDonacion = donacionesCong[0];
  scrollToDonacion(primeraDonacion.donacionID);
  
  // Opcional: Resaltar todas las donaciones de esa congregación
  donacionesCong.forEach(d => {
    const elemento = document.getElementById(`donacion-${d.donacionID}`);
    if(elemento) {
      elemento.classList.add('highlight-donacion');
      setTimeout(() => {
        elemento.classList.remove('highlight-donacion');
      }, 3000);
    }
  });
}

// ==================== EDITAR DONACIÓN ====================
window.editarDonacion = async function(id){
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
    
    // Preguntar por cada campo
    const fecha = prompt('Fecha (YYYY-MM-DD):', data.fecha);
    if(fecha === null) return; // Usuario canceló
    
    const nombreCongregacion = prompt('Nombre Congregación:', data.nombreCongregacion);
    if(nombreCongregacion === null) return;
    
    const nombrePastor = prompt('Nombre Pastor:', data.nombrePastor || '');
    if(nombrePastor === null) return;
    
    const ofrendaSolidaria = prompt('Ofrenda Solidaria:', data.ofrendaSolidaria || 0);
    if(ofrendaSolidaria === null) return;
    
    const aportePersonal = prompt('Nombre Persona (aporte personal):', data.aportePersonal || '');
    if(aportePersonal === null) return;
    
    const aporteIndividual = prompt('Aporte Individual:', data.aporteIndividual || 0);
    if(aporteIndividual === null) return;

    // Calcular día de la semana para la nueva fecha
    const [anio, mes, dia] = fecha.split('-');
    const fechaObj = new Date(anio, mes - 1, dia);
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const diaSemana = dias[fechaObj.getDay()];

    const updateData = {
      fecha,
      diaSemana,
      nombreCongregacion: nombreCongregacion.trim(),
      nombrePastor: nombrePastor.trim(),
      ofrendaSolidaria: Number(ofrendaSolidaria),
      aportePersonal: aportePersonal.trim(),
      aporteIndividual: Number(aporteIndividual),
      tieneAportePersonal: aportePersonal.trim() !== '' || Number(aporteIndividual) > 0
    };

    await updateDoc(ref, updateData);
    alert('✅ Donación actualizada');

  }catch(err){
    console.error(err);
    alert('❌ Error al editar: ' + err.message);
  }
}

// ==================== ELIMINAR DONACIÓN ====================
window.eliminarDonacion = async function(id, fotoPath){
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

  console.log(`📉 ${egresosGlobal.length} egresos cargados, Total: $${totalEgresos.toLocaleString('es-CO')}`);
  
  mostrarEgresos();
  
  // 🔧 CORRECCIÓN: Actualizar totales de egresos usando los ingresos globales
  actualizarTotalesEgresos(totalesGlobales.general);
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

// ==================== INICIALIZAR ====================
cargarDonaciones();