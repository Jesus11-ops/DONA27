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
const ADMIN_EMAIL = 'J3006091729@gmail.com';
let esUsuarioAdmin = false;

// Variables globales
let congregacionesGlobal = {};
let filtroActual = 'todos';
let donacionesGlobal = [];
let egresosGlobal = [];

// Variables globales para totales
let totalesGlobales = {
  ofrendas: 0,
  aportes: 0,
  general: 0,
  cantidad: 0,
  cantOfrendas: 0,
  cantAportes: 0
};

// Función para verificar permisos
function verificarPermisos(userEmail) {
  esUsuarioAdmin = userEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  console.log(`👤 Usuario: ${userEmail} | Admin: ${esUsuarioAdmin}`);
  actualizarInterfazSegunPermisos();
  return esUsuarioAdmin;
}

// Actualizar interfaz según permisos
function actualizarInterfazSegunPermisos() {
  const seccionRegistro = document.querySelector('.card:has(#fecha)');
  if (seccionRegistro) {
    seccionRegistro.style.display = esUsuarioAdmin ? 'block' : 'none';
  }
  
  const seccionEgresos = document.querySelector('.card:has(#egresoConcepto)');
  if (seccionEgresos) {
    seccionEgresos.style.display = esUsuarioAdmin ? 'block' : 'none';
  }
  
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

// Verificar permisos antes de acciones
function verificarPermisosAccion(nombreAccion) {
  if (!esUsuarioAdmin) {
    alert(`⛔ Acceso Denegado\n\nSolo el administrador puede ${nombreAccion}.\n\nTu cuenta tiene permisos de solo lectura.`);
    return false;
  }
  return true;
}

// ==================== FORMATEO DE NÚMEROS ====================
function formatearNumero(valor) {
  const numero = valor.replace(/\D/g, '');
  if (numero === '') return '';
  return Number(numero).toLocaleString('es-CO');
}

function obtenerValorNumerico(valor) {
  const numero = valor.replace(/\D/g, '');
  return numero === '' ? 0 : Number(numero);
}

function aplicarFormateoNumero(inputId, hiddenId) {
  const input = document.getElementById(inputId);
  const hidden = document.getElementById(hiddenId);
  
  if (!input) return;
  
  input.addEventListener('input', function(e) {
    const cursorPos = e.target.selectionStart;
    const valorAnterior = e.target.value;
    const longitudAnterior = valorAnterior.length;
    
    const valorFormateado = formatearNumero(e.target.value);
    e.target.value = valorFormateado;
    
    if (hidden) {
      hidden.value = obtenerValorNumerico(valorFormateado);
    }
    
    const longitudNueva = valorFormateado.length;
    const diferencia = longitudNueva - longitudAnterior;
    const nuevaPosicion = cursorPos + diferencia;
    
    e.target.setSelectionRange(nuevaPosicion, nuevaPosicion);
  });
  
  input.addEventListener('blur', function(e) {
    if (e.target.value === '') {
      e.target.value = '0';
      if (hidden) hidden.value = '0';
    }
  });
  
  input.addEventListener('focus', function(e) {
    if (e.target.value === '0') {
      e.target.value = '';
      if (hidden) hidden.value = '0';
    }
  });
}

// Inicializar formateo
window.addEventListener('DOMContentLoaded', () => {
  aplicarFormateoNumero('ofrendaSolidaria', 'ofrendaSolidariaValue');
  aplicarFormateoNumero('aporteIndividual', 'aporteIndividualValue');
  aplicarFormateoNumero('egresoMonto', 'egresoMontoValue');
  
  const fechaInput = document.getElementById('fecha');
  if(fechaInput){
    const hoy = new Date().toISOString().split('T')[0];
    fechaInput.value = hoy;
  }
  
  const fechaEgreso = document.getElementById('egresoFecha');
  if(fechaEgreso){
    const hoy = new Date().toISOString().split('T')[0];
    fechaEgreso.value = hoy;
  }
});

// ==================== AUTENTICACIÓN ====================
onAuthStateChanged(auth, user => {
  if (!user) {
    if (!location.pathname.endsWith('index.html') && !location.pathname.endsWith('/')) {
      window.location.href = 'index.html';
    }
  } else {
    console.log('Usuario autenticado:', user.email);
    verificarPermisos(user.email);
  }
});

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
window.toggleTipoDonacion = function(){
  const checkbox = document.getElementById('esAportePersonal');
  const seccionCongregacion = document.getElementById('seccionCongregacion');
  const seccionAportePersonal = document.getElementById('seccionAportePersonal');
  
  if(checkbox && seccionCongregacion && seccionAportePersonal){
    if(checkbox.checked){
      seccionCongregacion.style.display = 'none';
      seccionAportePersonal.style.display = 'block';
      
      document.getElementById('nombrePastor').value = '';
      document.getElementById('ofrendaSolidaria').value = '0';
      document.getElementById('ofrendaSolidariaValue').value = '0';
    } else {
      seccionCongregacion.style.display = 'block';
      seccionAportePersonal.style.display = 'none';
      
      document.getElementById('aportePersonalCongregacion').value = '';
      document.getElementById('aportePersonalNombre').value = '';
      document.getElementById('aporteIndividual').value = '0';
      document.getElementById('aporteIndividualValue').value = '0';
      document.getElementById('foto').value = '';
      document.getElementById('previewContainer').style.display = 'none';
    }
  }
}

window.previewImagen = function(){
  const file = document.getElementById('foto').files[0];
  const preview = document.getElementById('preview');
  const container = document.getElementById('previewContainer');
  
  if(file){
    const reader = new FileReader();
    reader.onload = function(e){
      preview.src = e.target.result;
      container.style.display = 'block';
    }
    reader.readAsDataURL(file);
  }else{
    container.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const fotoInput = document.getElementById('foto');
  if(fotoInput){
    fotoInput.addEventListener('change', window.previewImagen);
  }
});

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

    let dataToSave;
    let fotoURL = '';

    if(esAportePersonal){
      const congregacion = document.getElementById('aportePersonalCongregacion').value.trim();
      const nombrePersona = document.getElementById('aportePersonalNombre').value.trim();
      const aporteValue = document.getElementById('aporteIndividualValue').value;
      const aporte = Number(aporteValue);
      const fotoFile = document.getElementById('foto').files[0];
      
      if(!congregacion){
        alert('⚠️ Ingrese el nombre de la congregación');
        return;
      }
      
      if(!nombrePersona){
        alert('⚠️ Ingrese el nombre de la persona');
        return;
      }
      
      if(aporte <= 0){
        alert('⚠️ Ingrese un monto válido');
        return;
      }

      if(fotoFile){
        const timestamp = Date.now();
        const fotoPath = `aportes/${timestamp}_${fotoFile.name}`;
        const fotoRef = ref(storage, fotoPath);
        await uploadBytes(fotoRef, fotoFile);
        fotoURL = await getDownloadURL(fotoRef);
      }

      const [anio, mes, dia] = fecha.split('-');
      const fechaObj = new Date(anio, mes - 1, dia);
      const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const diaSemana = dias[fechaObj.getDay()];

      dataToSave = {
        fecha,
        diaSemana,
        nombreCongregacion: congregacion,
        nombrePastor: '',
        ofrendaSolidaria: 0,
        tieneAportePersonal: true,
        aportePersonal: nombrePersona,
        aporteIndividual: aporte,
        fotoURL,
        fotoPath: fotoURL ? `aportes/${timestamp}_${fotoFile.name}` : '',
        creadoEn: new Date().toISOString()
      };
    }else{
      const nombreCongregacion = document.getElementById('nombreCongregacion').value.trim();
      const nombrePastor = document.getElementById('nombrePastor').value.trim();
      const ofrendaValue = document.getElementById('ofrendaSolidariaValue').value;
      const ofrenda = Number(ofrendaValue);
      
      if(!nombreCongregacion){
        alert('⚠️ Ingrese el nombre de la congregación');
        return;
      }
      
      if(!nombrePastor){
        alert('⚠️ Ingrese el nombre del pastor');
        return;
      }
      
      if(ofrenda <= 0){
        alert('⚠️ Ingrese un monto válido');
        return;
      }

      const [anio, mes, dia] = fecha.split('-');
      const fechaObj = new Date(anio, mes - 1, dia);
      const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const diaSemana = dias[fechaObj.getDay()];

      dataToSave = {
        fecha,
        diaSemana,
        nombreCongregacion,
        nombrePastor,
        ofrendaSolidaria: ofrenda,
        tieneAportePersonal: false,
        aportePersonal: '',
        aporteIndividual: 0,
        fotoURL: '',
        fotoPath: '',
        creadoEn: new Date().toISOString()
      };
    }

    await addDoc(collection(db, 'Donaciones'), dataToSave);
    alert('✅ Donación registrada correctamente');

    document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
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
    document.getElementById('esAportePersonal').checked = false;
    toggleTipoDonacion();

  }catch(err){
    console.error('Error guardando donación:', err);
    alert('❌ Error al guardar: ' + err.message);
  }
}

// ==================== CARGAR DONACIONES ====================
function cargarDonaciones(){
  const q = query(collection(db, 'Donaciones'), orderBy('fecha', 'desc'));
  
  onSnapshot(q, snap => {
    donacionesGlobal = [];
    congregacionesGlobal = {};
    
    let totalOfrendas = 0;
    let totalAportes = 0;
    let totalGeneral = 0;
    let cantOfrendas = 0;
    let cantAportes = 0;
    let numeroID = 1;

    snap.forEach(docSnap => {
      const data = docSnap.data();
      
      donacionesGlobal.push({
        id: docSnap.id,
        numeroID: numeroID++,
        data: data
      });

      if(data.ofrendaSolidaria > 0){
        totalOfrendas += data.ofrendaSolidaria;
        cantOfrendas++;
      }
      
      if(data.aporteIndividual > 0){
        totalAportes += data.aporteIndividual;
        cantAportes++;
      }
      
      totalGeneral += (data.ofrendaSolidaria || 0) + (data.aporteIndividual || 0);

      const nombreCong = data.nombreCongregacion || 'Sin congregación';
      if(!congregacionesGlobal[nombreCong]){
        congregacionesGlobal[nombreCong] = {
          ofrendasSolidarias: 0,
          aportesIndividuales: 0,
          total: 0,
          cantidad: 0
        };
      }
      
      congregacionesGlobal[nombreCong].ofrendasSolidarias += data.ofrendaSolidaria || 0;
      congregacionesGlobal[nombreCong].aportesIndividuales += data.aporteIndividual || 0;
      congregacionesGlobal[nombreCong].total += (data.ofrendaSolidaria || 0) + (data.aporteIndividual || 0);
      congregacionesGlobal[nombreCong].cantidad++;
    });

    totalesGlobales = {
      ofrendas: totalOfrendas,
      aportes: totalAportes,
      general: totalGeneral,
      cantidad: snap.size,
      cantOfrendas,
      cantAportes
    };

    console.log(`📊 ${snap.size} donaciones cargadas, Total: $${totalGeneral.toLocaleString('es-CO')}`);
    
    mostrarDonaciones();
    actualizarTotales();
    mostrarCongregaciones();
    calcularYMostrarSaldosDisponibles();
  });
}

// ==================== 🆕 v3.2: CALCULAR SALDOS DISPONIBLES ====================
function calcularYMostrarSaldosDisponibles() {
  let egresosOfrendas = 0;
  let egresosAportes = 0;
  
  egresosGlobal.forEach(egreso => {
    const fuente = egreso.data.fuenteEgreso || 'ofrendasSolidarias';
    const monto = egreso.data.monto || 0;
    
    if (fuente === 'ofrendasSolidarias') {
      egresosOfrendas += monto;
    } else if (fuente === 'aportesIndividuales') {
      egresosAportes += monto;
    }
  });
  
  const saldoOfrendas = totalesGlobales.ofrendas - egresosOfrendas;
  const saldoAportes = totalesGlobales.aportes - egresosAportes;
  
  const elemOfrendas = document.getElementById('saldoOfrendasDisponible');
  const elemAportes = document.getElementById('saldoAportesDisponible');
  
  if (elemOfrendas) {
    elemOfrendas.textContent = `$${saldoOfrendas.toLocaleString('es-CO')}`;
    elemOfrendas.style.color = saldoOfrendas >= 0 ? '#10b981' : '#ef4444';
  }
  
  if (elemAportes) {
    elemAportes.textContent = `$${saldoAportes.toLocaleString('es-CO')}`;
    elemAportes.style.color = saldoAportes >= 0 ? '#10b981' : '#ef4444';
  }
  
  console.log(`💼 Saldos: Ofrendas=$${saldoOfrendas.toLocaleString('es-CO')}, Aportes=$${saldoAportes.toLocaleString('es-CO')}`);
}

// ==================== MOSTRAR DONACIONES ====================
function mostrarDonaciones() {
  const container = document.getElementById('listaDonaciones');
  if(!container) return;

  if(donacionesGlobal.length === 0){
    container.innerHTML = '<p style="text-align:center;color:#6b7280;padding:40px">No hay donaciones registradas</p>';
    return;
  }

  let html = '<div class="donaciones-grid">';

  donacionesGlobal.forEach(donacion => {
    const d = donacion.data;
    const total = (d.ofrendaSolidaria || 0) + (d.aporteIndividual || 0);
    const puedeEditar = esUsuarioAdmin;
    
    html += `
      <div class="donacion-card" id="donacion-${donacion.numeroID}">
        <div class="donacion-header">
          <div>
            <span class="donacion-numero">#${donacion.numeroID}</span>
            <h3>⛪ ${d.nombreCongregacion}</h3>
            <p class="muted">${d.diaSemana}, ${d.fecha}</p>
          </div>
          <div class="donacion-total">$${total.toLocaleString('es-CO')}</div>
        </div>
        <div class="donacion-body">
    `;
    
    if(d.ofrendaSolidaria > 0){
      html += `
        <div class="info-row">
          <span class="label">👨‍🏫 Pastor</span>
          <span>${d.nombrePastor}</span>
        </div>
        <div class="info-row">
          <span class="label">💵 Ofrenda Solidaria</span>
          <span>$${d.ofrendaSolidaria.toLocaleString('es-CO')}</span>
        </div>
      `;
    }
    
    if(d.aporteIndividual > 0){
      html += `
        <div class="info-row">
          <span class="label">👤 Aporte de</span>
          <span>${d.aportePersonal}</span>
        </div>
        <div class="info-row">
          <span class="label">💰 Monto Individual</span>
          <span>$${d.aporteIndividual.toLocaleString('es-CO')}</span>
        </div>
      `;
      
      if(d.fotoURL){
        html += `
          <div class="foto-comprobante">
            <img src="${d.fotoURL}" alt="Comprobante" onclick="window.open('${d.fotoURL}', '_blank')">
          </div>
        `;
      }
    }
    
    html += `
        </div>
        ${puedeEditar ? `
        <div class="donacion-actions">
          <button class="btn edit" onclick="editarDonacion('${donacion.id}')">✏️ Editar</button>
          <button class="btn delete" onclick="eliminarDonacion('${donacion.id}', '${d.fotoPath || ''}')">🗑️ Eliminar</button>
        </div>
        ` : ''}
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

// ==================== ACTUALIZAR TOTALES ====================
function actualizarTotales(){
  document.getElementById('totalOfrendas').textContent = `$${totalesGlobales.ofrendas.toLocaleString('es-CO')}`;
  document.getElementById('totalAportes').textContent = `$${totalesGlobales.aportes.toLocaleString('es-CO')}`;
  document.getElementById('totalGeneral').textContent = `$${totalesGlobales.general.toLocaleString('es-CO')}`;
  document.getElementById('totalDonaciones').textContent = `${totalesGlobales.cantidad} donaciones`;
  document.getElementById('cantidadOfrendas').textContent = `${totalesGlobales.cantOfrendas} aportes`;
  document.getElementById('cantidadAportes').textContent = `${totalesGlobales.cantAportes} aportes`;
  
  // Actualizar también el resumen de egresos con el total correcto
  actualizarTotalesEgresos(totalesGlobales.general);
}

// ==================== ACTUALIZAR TOTALES EGRESOS ====================
function actualizarTotalesEgresos(totalIngresos){
  let totalEgresos = 0;
  egresosGlobal.forEach(e => {
    totalEgresos += e.data.monto || 0;
  });

  // Si totalIngresos es undefined o 0, usar totalesGlobales.general
  const ingresosActuales = totalIngresos || totalesGlobales.general || 0;
  const saldoDisponible = ingresosActuales - totalEgresos;

  document.getElementById('totalEgresos').textContent = `$${totalEgresos.toLocaleString('es-CO')}`;
  document.getElementById('cantidadEgresos').textContent = `${egresosGlobal.length} egresos`;
  document.getElementById('saldoDisponible').textContent = `$${saldoDisponible.toLocaleString('es-CO')}`;
  
  const saldoElement = document.getElementById('saldoDisponible');
  if(saldoDisponible < 0){
    saldoElement.style.color = '#ef4444';
  } else {
    saldoElement.style.color = '#10b981';
  }
  
  calcularYMostrarSaldosDisponibles();
}

// ==================== MOSTRAR CONGREGACIONES ====================
function mostrarCongregaciones() {
  const container = document.getElementById('tablaCongregaciones');
  if(!container) return;

  const congregaciones = Object.entries(congregacionesGlobal);
  
  if(congregaciones.length === 0){
    container.innerHTML = '<p style="text-align:center;color:#6b7280;padding:20px">No hay congregaciones registradas</p>';
    return;
  }

  let congregacionesFiltradas = congregaciones.map(([nombre, datos]) => {
    let mostrar = true;
    let totalMostrar = 0;
    
    if(filtroActual === 'ofrendas'){
      mostrar = datos.ofrendasSolidarias > 0;
      totalMostrar = datos.ofrendasSolidarias;
    } else if(filtroActual === 'aportes'){
      mostrar = datos.aportesIndividuales > 0;
      totalMostrar = datos.aportesIndividuales;
    } else {
      totalMostrar = datos.total;
    }
    
    return { nombre, datos, mostrar, totalMostrar };
  }).filter(c => c.mostrar);

  congregacionesFiltradas.sort((a, b) => b.totalMostrar - a.totalMostrar);

  let html = '<div class="tabla-congregaciones">';
  
  // Header con todas las columnas
  html += '<div class="tabla-header">';
  html += '<div class="tabla-col">Congregación</div>';
  html += '<div class="tabla-col">Ofrendas</div>';
  html += '<div class="tabla-col">Aportes</div>';
  html += '<div class="tabla-col">Total</div>';
  html += '<div class="tabla-col">Registros</div>';
  html += '<div class="tabla-col">Ver</div>';
  html += '</div>';

  // Filas con todas las columnas
  let isEven = false;
  congregacionesFiltradas.forEach(({ nombre, datos }) => {
    const rowClass = isEven ? 'tabla-row even' : 'tabla-row';
    html += `<div class="${rowClass}">`;
    html += `<div class="tabla-col">${nombre}</div>`;
    html += `<div class="tabla-col">$${datos.ofrendasSolidarias.toLocaleString('es-CO')}</div>`;
    html += `<div class="tabla-col">$${datos.aportesIndividuales.toLocaleString('es-CO')}</div>`;
    html += `<div class="tabla-col"><strong>$${datos.total.toLocaleString('es-CO')}</strong></div>`;
    html += `<div class="tabla-col">${datos.cantidad}</div>`;
    html += `<div class="tabla-col"><a href="#" class="link" onclick="filtrarPorCongregacion('${nombre.replace(/'/g, "\\'")}'); return false;">📋 Ver detalles</a></div>`;
    html += '</div>';
    isEven = !isEven;
  });

  html += '</div>';
  container.innerHTML = html;
}

// ==================== FILTRAR CONGREGACIONES ====================
window.filtrarCongregaciones = function(filtro) {
  filtroActual = filtro;
  
  document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const btnActivo = document.querySelector(`[data-filtro="${filtro}"]`);
  if(btnActivo) btnActivo.classList.add('active');
  
  mostrarCongregaciones();
}

// ==================== FILTRAR POR CONGREGACIÓN ESPECÍFICA ====================
window.filtrarPorCongregacion = function(nombreCongregacion) {
  const listaDonaciones = document.getElementById('listaDonaciones');
  if (!listaDonaciones) return;
  
  // Scroll suave a la sección de donaciones
  listaDonaciones.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'start' 
  });
  
  // Esperar a que termine el scroll antes de resaltar
  setTimeout(() => {
    // Resaltar solo las donaciones de esta congregación
    const todasLasDonaciones = document.querySelectorAll('.donacion-card');
    todasLasDonaciones.forEach(card => {
      const titulo = card.querySelector('.donacion-header h3');
      if (titulo && titulo.textContent.includes(nombreCongregacion)) {
        card.classList.add('highlight-donacion');
        setTimeout(() => {
          card.classList.remove('highlight-donacion');
        }, 3000);
      }
    });
  }, 500);
}

// ==================== EDITAR / ELIMINAR DONACIÓN ====================
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
    
    const fecha = prompt('Fecha (YYYY-MM-DD):', data.fecha);
    if(fecha === null) return;
    
    const nombreCongregacion = prompt('Nombre Congregación:', data.nombreCongregacion);
    if(nombreCongregacion === null) return;
    
    const nombrePastor = prompt('Nombre Pastor:', data.nombrePastor || '');
    if(nombrePastor === null) return;
    
    const ofrendaSolidaria = prompt('Ofrenda Solidaria:', data.ofrendaSolidaria || 0);
    if(ofrendaSolidaria === null) return;
    
    const aportePersonal = prompt('Nombre Persona (si aplica):', data.aportePersonal || '');
    if(aportePersonal === null) return;
    
    const aporteIndividual = prompt('Aporte Individual:', data.aporteIndividual || 0);
    if(aporteIndividual === null) return;

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
      tieneAportePersonal: aporteIndividual > 0
    };

    await updateDoc(ref, updateData);
    alert('✅ Donación actualizada');

  }catch(err){
    console.error(err);
    alert('❌ Error al editar: ' + err.message);
  }
}

window.eliminarDonacion = async function(id, fotoPath){
  if (!verificarPermisosAccion('eliminar donaciones')) {
    return;
  }
  
  try{
    const conf = confirm('⚠️ ¿Está seguro de eliminar esta donación?');
    if(!conf) return;

    if(fotoPath){
      try{
        const fotoRef = ref(storage, fotoPath);
        await deleteObject(fotoRef);
        console.log('Foto eliminada del storage');
      }catch(err){
        console.warn('No se pudo eliminar la foto:', err);
      }
    }

    const docRef = doc(db, 'Donaciones', id);
    await deleteDoc(docRef);
    
    alert('✅ Donación eliminada');

  }catch(err){
    console.error(err);
    alert('❌ Error al eliminar: ' + err.message);
  }
}

window.scrollToDonacion = function(donacionID) {
  event.preventDefault();
  
  const elemento = document.getElementById(`donacion-${donacionID}`);
  
  if (elemento) {
    elemento.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    elemento.classList.add('highlight-donacion');
    
    setTimeout(() => {
      elemento.classList.remove('highlight-donacion');
    }, 2000);
  } else {
    console.warn(`No se encontró la donación con ID: ${donacionID}`);
  }
}

// ==================== 🆕 v3.2: GUARDAR EGRESO CON FUENTE ====================
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
    const fuenteEgreso = document.getElementById('fuenteEgreso').value;
    
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
    
    // Calcular saldo disponible en la fuente seleccionada
    let egresosEnFuente = 0;
    egresosGlobal.forEach(egreso => {
      if (egreso.data.fuenteEgreso === fuenteEgreso) {
        egresosEnFuente += egreso.data.monto || 0;
      }
    });
    
    const totalFuente = fuenteEgreso === 'ofrendasSolidarias' ? totalesGlobales.ofrendas : totalesGlobales.aportes;
    const saldoDisponible = totalFuente - egresosEnFuente;
    
    if (monto > saldoDisponible) {
      const nombreFuente = fuenteEgreso === 'ofrendasSolidarias' ? 'Ofrendas Solidarias' : 'Aportes Individuales';
      alert(`⚠️ Saldo insuficiente en ${nombreFuente}\n\nDisponible: $${saldoDisponible.toLocaleString('es-CO')}\nIntentando retirar: $${monto.toLocaleString('es-CO')}`);
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
      fuenteEgreso,
      creadoEn: new Date().toISOString()
    };

    await addDoc(collection(db, 'Egresos'), dataToSave);
    alert('✅ Egreso registrado correctamente');

    document.getElementById('egresoFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('egresoConcepto').value = '';
    document.getElementById('egresoDescripcion').value = '';
    document.getElementById('egresoMonto').value = '0';
    document.getElementById('egresoMontoValue').value = '0';
    document.getElementById('fuenteEgreso').value = 'ofrendasSolidarias';

  }catch(err){
    console.error('Error guardando egreso:', err);
    alert('❌ Error al guardar egreso: ' + err.message);
  }
}

// ==================== CARGAR EGRESOS ====================
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
    const fuenteTexto = d.fuenteEgreso === 'ofrendasSolidarias' ? 'Ofrendas Solidarias' : 'Aportes Individuales';
    const fuenteIcono = d.fuenteEgreso === 'ofrendasSolidarias' ? '⛪' : '👤';
    
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
          <div class="info-row">
            <span class="label">${fuenteIcono} Fuente</span>
            <span>${fuenteTexto}</span>
          </div>
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

// ==================== EDITAR / ELIMINAR EGRESO ====================
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
    
    const fuenteEgreso = confirm('¿El egreso fue de Ofrendas Solidarias?\n\nOK = Ofrendas Solidarias\nCancelar = Aportes Individuales') 
      ? 'ofrendasSolidarias' 
      : 'aportesIndividuales';

    const [anio, mes, dia] = fecha.split('-');
    const fechaObj = new Date(anio, mes - 1, dia);
    const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const diaSemana = dias[fechaObj.getDay()];

    const updateData = {
      fecha,
      diaSemana,
      concepto: concepto.trim(),
      descripcion: descripcion.trim(),
      monto: Number(monto),
      fuenteEgreso
    };

    await updateDoc(ref, updateData);
    alert('✅ Egreso actualizado');

  }catch(err){
    console.error(err);
    alert('❌ Error al editar: ' + err.message);
  }
}

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