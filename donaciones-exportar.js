import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);

// Email del administrador
const ADMIN_EMAIL = 'J3006091729@gmail.com';

window.exportarExcel = async function() {
  // Verificar permisos - solo el admin puede exportar
  const user = auth.currentUser;
  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    alert('⛔ Acceso Denegado\n\nSolo el administrador puede exportar datos.\n\nTu cuenta tiene permisos de solo lectura.');
    return;
  }
  
  // 🆕 Crear hoja de Donaciones
  const rowsDonaciones = [];
  rowsDonaciones.push([
    "Fecha", 
    "Día Semana", 
    "Congregación", 
    "Pastor", 
    "Ofrenda Solidaria",
    "Tiene Aporte Personal",
    "Nombre Persona",
    "Aporte Individual",
    "Total"
  ]);

  try {
    const q = query(collection(db, 'Donaciones'), orderBy('fecha', 'asc'));
    const snap = await getDocs(q);
    
    if(snap.empty){
      alert('⚠️ No hay donaciones para exportar');
      return;
    }

    snap.forEach(docSnap => {
      const d = docSnap.data();
      const total = (d.ofrendaSolidaria || 0) + (d.aporteIndividual || 0);
      
      rowsDonaciones.push([
        d.fecha || '',
        d.diaSemana || '',
        d.nombreCongregacion || '',
        d.nombrePastor || '',
        Number(d.ofrendaSolidaria || 0),
        d.tieneAportePersonal ? 'Sí' : 'No',
        d.aportePersonal || '',
        Number(d.aporteIndividual || 0),
        total
      ]);
    });

    console.log(`📊 Exportando ${rowsDonaciones.length - 1} donaciones`);

  } catch (err) {
    console.error('Error leyendo Donaciones:', err);
    alert('❌ No se pudieron leer las donaciones desde la base de datos');
    return;
  }

  // 🆕 Crear hoja de Egresos
  const rowsEgresos = [];
  rowsEgresos.push([
    "Fecha",
    "Día Semana",
    "Concepto",
    "Descripción",
    "Monto"
  ]);

  try {
    const qEgresos = query(collection(db, 'Egresos'), orderBy('fecha', 'asc'));
    const snapEgresos = await getDocs(qEgresos);
    
    snapEgresos.forEach(docSnap => {
      const e = docSnap.data();
      
      rowsEgresos.push([
        e.fecha || '',
        e.diaSemana || '',
        e.concepto || '',
        e.descripcion || '',
        Number(e.monto || 0)
      ]);
    });

    console.log(`💸 Exportando ${rowsEgresos.length - 1} egresos`);

  } catch (err) {
    console.error('Error leyendo Egresos:', err);
    // No es crítico si no hay egresos
  }

  await createAndDownloadXLSX(rowsDonaciones, rowsEgresos);
}

async function createAndDownloadXLSX(dataDonaciones, dataEgresos) {
  const runWithExcelJS = async () => {
    const wb = new ExcelJS.Workbook();
    
    // ========== HOJA 1: DONACIONES ==========
    const wsDonaciones = wb.addWorksheet('Donaciones');

    // Definir columnas con anchos
    wsDonaciones.columns = [
      { header: dataDonaciones[0][0], key: 'fecha', width: 12 },
      { header: dataDonaciones[0][1], key: 'diaSemana', width: 12 },
      { header: dataDonaciones[0][2], key: 'congregacion', width: 25 },
      { header: dataDonaciones[0][3], key: 'pastor', width: 25 },
      { header: dataDonaciones[0][4], key: 'ofrendaSolidaria', width: 18 },
      { header: dataDonaciones[0][5], key: 'tieneAportePersonal', width: 18 },
      { header: dataDonaciones[0][6], key: 'nombrePersona', width: 25 },
      { header: dataDonaciones[0][7], key: 'aporteIndividual', width: 18 },
      { header: dataDonaciones[0][8], key: 'total', width: 15 }
    ];

    // Estilo de cabecera
    const headerRowDonaciones = wsDonaciones.getRow(1);
    headerRowDonaciones.height = 20;
    headerRowDonaciones.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2E86AB' }
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Añadir filas de datos
    for (let i = 1; i < dataDonaciones.length; i++) {
      const row = wsDonaciones.addRow(dataDonaciones[i]);
      
      // Formato de números con separador de miles
      [5, 8, 9].forEach(colIndex => {
        const cell = row.getCell(colIndex);
        if(typeof cell.value === 'number'){
          cell.numFmt = '#,##0';
        }
      });
    }

    // Agregar fila de totales al final
    const totalRowDonaciones = wsDonaciones.addRow([
      '', '', '', 'TOTALES:',
      { formula: `SUM(E2:E${dataDonaciones.length})` },
      '',
      '',
      { formula: `SUM(H2:H${dataDonaciones.length})` },
      { formula: `SUM(I2:I${dataDonaciones.length})` }
    ]);

    totalRowDonaciones.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      if([5, 8, 9].includes(colNumber)){
        cell.numFmt = '#,##0';
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFD700' }
        };
      }
    });

    // ========== HOJA 2: EGRESOS ==========
    if(dataEgresos.length > 1) { // Solo si hay egresos
      const wsEgresos = wb.addWorksheet('Egresos');

      wsEgresos.columns = [
        { header: dataEgresos[0][0], key: 'fecha', width: 12 },
        { header: dataEgresos[0][1], key: 'diaSemana', width: 12 },
        { header: dataEgresos[0][2], key: 'concepto', width: 30 },
        { header: dataEgresos[0][3], key: 'descripcion', width: 40 },
        { header: dataEgresos[0][4], key: 'monto', width: 15 }
      ];

      // Estilo de cabecera
      const headerRowEgresos = wsEgresos.getRow(1);
      headerRowEgresos.height = 20;
      headerRowEgresos.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEF4444' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Añadir filas de datos
      for (let i = 1; i < dataEgresos.length; i++) {
        const row = wsEgresos.addRow(dataEgresos[i]);
        
        // Formato de números con separador de miles
        const cell = row.getCell(5);
        if(typeof cell.value === 'number'){
          cell.numFmt = '#,##0';
        }
      }

      // Agregar fila de totales al final
      const totalRowEgresos = wsEgresos.addRow([
        '', '', '', 'TOTAL EGRESOS:',
        { formula: `SUM(E2:E${dataEgresos.length})` }
      ]);

      totalRowEgresos.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
        if(colNumber === 5){
          cell.numFmt = '#,##0';
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEF4444' }
          };
        }
      });
    }

    // ========== HOJA 3: RESUMEN ==========
    const wsResumen = wb.addWorksheet('Resumen');
    
    // Calcular totales
    let totalIngresos = 0;
    for(let i = 1; i < dataDonaciones.length; i++){
      totalIngresos += dataDonaciones[i][8]; // Columna Total
    }
    
    let totalEgresos = 0;
    for(let i = 1; i < dataEgresos.length; i++){
      totalEgresos += dataEgresos[i][4]; // Columna Monto
    }
    
    const saldo = totalIngresos - totalEgresos;
    
    // Configurar columnas
    wsResumen.columns = [
      { width: 30 },
      { width: 20 }
    ];
    
    // Título
    const tituloRow = wsResumen.addRow(['RESUMEN FINANCIERO', '']);
    tituloRow.font = { bold: true, size: 16 };
    tituloRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF667EEA' }
    };
    tituloRow.getCell(1).font.color = { argb: 'FFFFFFFF' };
    wsResumen.mergeCells('A1:B1');
    
    // Espacio
    wsResumen.addRow(['', '']);
    
    // Fila: Total Ingresos
    const ingresosRow = wsResumen.addRow(['Total Ingresos (Donaciones)', totalIngresos]);
    ingresosRow.getCell(1).font = { bold: true };
    ingresosRow.getCell(2).numFmt = '#,##0';
    ingresosRow.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' }
    };
    ingresosRow.getCell(2).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    // Fila: Total Egresos
    const egresosRow = wsResumen.addRow(['Total Egresos', totalEgresos]);
    egresosRow.getCell(1).font = { bold: true };
    egresosRow.getCell(2).numFmt = '#,##0';
    egresosRow.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEF4444' }
    };
    egresosRow.getCell(2).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    // Espacio
    wsResumen.addRow(['', '']);
    
    // Fila: Saldo Disponible
    const saldoRow = wsResumen.addRow(['SALDO DISPONIBLE', saldo]);
    saldoRow.getCell(1).font = { bold: true, size: 14 };
    saldoRow.getCell(2).numFmt = '#,##0';
    saldoRow.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF59E0B' }
    };
    saldoRow.getCell(2).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    
    // Espacio
    wsResumen.addRow(['', '']);
    wsResumen.addRow(['', '']);
    
    // Información adicional
    const cantidadDonaciones = dataDonaciones.length - 1;
    const cantidadEgresos = dataEgresos.length - 1;
    
    wsResumen.addRow(['Cantidad de Donaciones:', cantidadDonaciones]);
    wsResumen.addRow(['Cantidad de Egresos:', cantidadEgresos]);

    // Generar archivo y forzar descarga
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donaciones_egresos_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.style.display = 'none';

    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS || isSafari) {
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 2000);
    } else if (navigator.msSaveOrOpenBlob) {
      navigator.msSaveOrOpenBlob(blob, a.download);
    } else {
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 1500);
    }

    console.log('✅ Excel con Donaciones, Egresos y Resumen exportado correctamente');
  };

  // Cargar ExcelJS si no está disponible
  if (!window.ExcelJS) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('No se pudo cargar ExcelJS'));
      document.head.appendChild(script);
    });
  }

  if (!window.ExcelJS) {
    alert('❌ No se pudo cargar la librería para crear el Excel');
    return;
  }

  await runWithExcelJS();
}
