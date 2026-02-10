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
  
  const rows = [];
  rows.push([
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
      
      rows.push([
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

    console.log(`📊 Exportando ${rows.length - 1} donaciones`);

  } catch (err) {
    console.error('Error leyendo Firestore para exportar:', err);
    alert('❌ No se pudieron leer los registros desde la base de datos');
    return;
  }

  await createAndDownloadXLSX(rows);
}

async function createAndDownloadXLSX(dataRows) {
  const runWithExcelJS = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Donaciones');

    // Definir columnas con anchos
    ws.columns = [
      { header: dataRows[0][0], key: 'fecha', width: 12 },
      { header: dataRows[0][1], key: 'diaSemana', width: 12 },
      { header: dataRows[0][2], key: 'congregacion', width: 25 },
      { header: dataRows[0][3], key: 'pastor', width: 25 },
      { header: dataRows[0][4], key: 'ofrendaSolidaria', width: 18 },
      { header: dataRows[0][5], key: 'tieneAportePersonal', width: 18 },
      { header: dataRows[0][6], key: 'nombrePersona', width: 25 },
      { header: dataRows[0][7], key: 'aporteIndividual', width: 18 },
      { header: dataRows[0][8], key: 'total', width: 15 }
    ];

    // Estilo de cabecera
    const headerRow = ws.getRow(1);
    headerRow.height = 20;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2E86AB' }
      };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Añadir filas de datos
    for (let i = 1; i < dataRows.length; i++) {
      const row = ws.addRow(dataRows[i]);
      
      // Formato de números con separador de miles
      [5, 8, 9].forEach(colIndex => {
        const cell = row.getCell(colIndex);
        if(typeof cell.value === 'number'){
          cell.numFmt = '#,##0';
        }
      });
    }

    // Agregar fila de totales al final
    const totalRow = ws.addRow([
      '', '', '', 'TOTALES:',
      { formula: `SUM(E2:E${dataRows.length})` },
      '',
      '',
      { formula: `SUM(H2:H${dataRows.length})` },
      { formula: `SUM(I2:I${dataRows.length})` }
    ]);

    totalRow.eachCell((cell, colNumber) => {
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

    // Generar archivo y forzar descarga
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
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

    console.log('✅ Excel exportado correctamente');
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