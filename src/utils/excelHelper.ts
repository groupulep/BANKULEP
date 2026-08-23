import * as XLSX from 'xlsx';
import { User } from '../types';

/**
 * Export all clients data to an Excel (.xlsx) file
 */
export const exportClientsToExcel = (users: User[]) => {
  const clients = users.filter((u) => u.role === 'client');

  const rows = clients.map((u, idx) => ({
    '#': idx + 1,
    'Cédula / Identificación': u.cedula,
    'Nombre Completo': u.name,
    'Teléfono': u.phone || '3169008561',
    'Correo Electrónico': u.email,
    'Número de Cuenta': u.accountNumber || u.clabe?.slice(-10) || '',
    'CLABE Interbancaria': u.clabe || '',
    'Estado':
      u.status === 'active'
        ? 'Activo'
        : u.status === 'pending'
        ? 'En Mora'
        : 'Cancelado',
    'Saldo Disponible (COP)': u.balance,
    'Línea de Crédito (COP)': u.creditLimit,
    'Deuda Actual (COP)': u.creditUsed,
    'Cuota Mensual (COP)': u.loanQuota ?? 1250000,
    'Número de Cuotas': u.loanQuotasTotal ?? 12,
    'Plazo Ciclo (Días)': u.paymentTermDays ?? 30,
    'Tasa Interés Diario (%)': u.dailyInterestRate ?? 0.5,
    'PIN / Clave': u.pin || '1234',
    'Fecha de Registro': u.createdAt || new Date().toISOString().split('T')[0],
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for polished presentation
  worksheet['!cols'] = [
    { wch: 4 },  // #
    { wch: 18 }, // Cedula
    { wch: 30 }, // Name
    { wch: 15 }, // Phone
    { wch: 30 }, // Email
    { wch: 16 }, // Account
    { wch: 22 }, // CLABE
    { wch: 12 }, // Status
    { wch: 20 }, // Balance
    { wch: 22 }, // Credit Limit
    { wch: 18 }, // Credit Used
    { wch: 18 }, // Quota
    { wch: 16 }, // Quotas total
    { wch: 16 }, // Term days
    { wch: 20 }, // Daily interest
    { wch: 12 }, // PIN
    { wch: 16 }, // Created At
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes CrediULEP');

  // Summary sheet
  const totalDebt = clients.reduce((acc, c) => acc + (c.creditUsed || 0), 0);
  const totalLimit = clients.reduce((acc, c) => acc + (c.creditLimit || 0), 0);
  const totalBalance = clients.reduce((acc, c) => acc + (c.balance || 0), 0);

  const summaryData = [
    { 'Concepto': 'Fecha de Exportación', 'Valor': new Date().toLocaleString('es-CO') },
    { 'Concepto': 'Total de Clientes', 'Valor': clients.length },
    { 'Concepto': 'Clientes Activos', 'Valor': clients.filter((c) => c.status === 'active').length },
    { 'Concepto': 'Clientes en Mora', 'Valor': clients.filter((c) => c.status === 'pending').length },
    { 'Concepto': 'Clientes Cancelados', 'Valor': clients.filter((c) => c.status === 'blocked').length },
    { 'Concepto': 'Total Cartera / Deuda (COP)', 'Valor': `$${totalDebt.toLocaleString('es-CO')}` },
    { 'Concepto': 'Total Cupos Asignados (COP)', 'Valor': `$${totalLimit.toLocaleString('es-CO')}` },
    { 'Concepto': 'Total Saldos Disponibles (COP)', 'Valor': `$${totalBalance.toLocaleString('es-CO')}` },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen Cartera');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Clientes_CrediULEP_${today}.xlsx`);
};

/**
 * Generate and download template Excel for bulk client uploading
 */
export const downloadBulkUploadTemplate = () => {
  const templateRows = [
    {
      'Nombre': 'Juan Carlos Rodriguez',
      'Cedula': '1098765432',
      'Telefono': '3169008561',
      'Email': 'juan.rodriguez@ejemplo.com',
      'Cupo_Credito': 1500000,
      'Deuda_Actual': 0,
      'Saldo_Disponible': 0,
      'Cuota_Mensual': 1250000,
      'Cuotas_Totales': 12,
      'Plazo_Dias': 30,
      'Tasa_Diaria_Pct': 0.5,
      'PIN': '1234',
      'Estado': 'active',
    },
    {
      'Nombre': 'María Fernanda Gómez',
      'Cedula': '52431980',
      'Telefono': '3104567890',
      'Email': 'maria.gomez@ejemplo.com',
      'Cupo_Credito': 2000000,
      'Deuda_Actual': 500000,
      'Saldo_Disponible': 150000,
      'Cuota_Mensual': 1250000,
      'Cuotas_Totales': 12,
      'Plazo_Dias': 30,
      'Tasa_Diaria_Pct': 0.5,
      'PIN': '4321',
      'Estado': 'active',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateRows);

  worksheet['!cols'] = [
    { wch: 28 }, // Nombre
    { wch: 16 }, // Cedula
    { wch: 15 }, // Telefono
    { wch: 28 }, // Email
    { wch: 16 }, // Cupo_Credito
    { wch: 16 }, // Deuda_Actual
    { wch: 18 }, // Saldo_Disponible
    { wch: 16 }, // Cuota_Mensual
    { wch: 16 }, // Cuotas_Totales
    { wch: 14 }, // Plazo_Dias
    { wch: 18 }, // Tasa_Diaria_Pct
    { wch: 10 }, // PIN
    { wch: 12 }, // Estado (active / pending / blocked)
  ];

  // Instructions Sheet
  const instructions = [
    { 'Columna': 'Nombre', 'Obligatorio': 'SÍ', 'Descripción': 'Nombre y apellidos completos del cliente' },
    { 'Columna': 'Cedula', 'Obligatorio': 'SÍ', 'Descripción': 'Número de documento de identidad único (sin puntos ni comas)' },
    { 'Columna': 'Telefono', 'Obligatorio': 'Opcional', 'Descripción': 'Número telefónico o celular (ej. 3169008561)' },
    { 'Columna': 'Email', 'Obligatorio': 'Opcional', 'Descripción': 'Correo electrónico del cliente (se auto-genera si está vacío)' },
    { 'Columna': 'Cupo_Credito', 'Obligatorio': 'Opcional', 'Descripción': 'Línea de crédito aprobada en COP (ej. 1000000)' },
    { 'Columna': 'Deuda_Actual', 'Obligatorio': 'Opcional', 'Descripción': 'Monto adeudado actual en COP (por defecto 0)' },
    { 'Columna': 'Saldo_Disponible', 'Obligatorio': 'Opcional', 'Descripción': 'Saldo a favor en cuenta en COP (por defecto 0)' },
    { 'Columna': 'Cuota_Mensual', 'Obligatorio': 'Opcional', 'Descripción': 'Valor de la cuota mensual en COP (por defecto 1250000)' },
    { 'Columna': 'Cuotas_Totales', 'Obligatorio': 'Opcional', 'Descripción': 'Total de cuotas del crédito (por defecto 12)' },
    { 'Columna': 'Plazo_Dias', 'Obligatorio': 'Opcional', 'Descripción': 'Plazo del ciclo en días (por defecto 30)' },
    { 'Columna': 'Tasa_Diaria_Pct', 'Obligatorio': 'Opcional', 'Descripción': 'Porcentaje de interés diario (por defecto 0.5%)' },
    { 'Columna': 'PIN', 'Obligatorio': 'Opcional', 'Descripción': 'Clave numérica de 4 dígitos para ingresar (por defecto 1234)' },
    { 'Columna': 'Estado', 'Obligatorio': 'Opcional', 'Descripción': 'active (activo), pending (en mora), blocked (cancelado)' },
  ];
  const instrSheet = XLSX.utils.json_to_sheet(instructions);
  instrSheet['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 60 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Clientes');
  XLSX.utils.book_append_sheet(workbook, instrSheet, 'Instrucciones');

  XLSX.writeFile(workbook, 'Plantilla_Carga_Masiva_Clientes_CrediULEP.xlsx');
};

export interface ParsedClientRow {
  isValid: boolean;
  errors: string[];
  user?: User;
  rawData: any;
}

/**
 * Parse uploaded Excel or CSV file buffer into User objects
 */
export const parseBulkClientsFile = async (file: File): Promise<ParsedClientRow[]> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const results: ParsedClientRow[] = [];

  jsonRows.forEach((row, index) => {
    // Normalize keys (lowercase, trim, remove accents and underscores)
    const normalized: Record<string, any> = {};
    Object.keys(row).forEach((key) => {
      const normKey = key
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
      normalized[normKey] = row[key];
    });

    const name =
      normalized['nombre'] ||
      normalized['nombrecompleto'] ||
      normalized['nombres'] ||
      normalized['cliente'] ||
      '';

    const rawCedula =
      normalized['cedula'] ||
      normalized['identificacion'] ||
      normalized['documento'] ||
      normalized['cc'] ||
      normalized['nit'] ||
      '';

    const cedula = String(rawCedula).replace(/[^0-9]/g, '').trim();

    const errors: string[] = [];

    if (!name || String(name).trim().length < 2) {
      errors.push('Nombre no especificado o inválido');
    }
    if (!cedula || cedula.length < 4) {
      errors.push('Cédula no válida (mínimo 4 dígitos)');
    }

    if (errors.length > 0) {
      results.push({
        isValid: false,
        errors,
        rawData: row,
      });
      return;
    }

    const phone = String(normalized['telefono'] || normalized['tel'] || normalized['celular'] || '3169008561').trim();
    const email = String(
      normalized['email'] ||
        normalized['correo'] ||
        normalized['correoelectronico'] ||
        `cliente_${cedula.slice(-4)}@crediulep.com`
    ).trim();

    const creditLimit = Math.max(
      0,
      Number(String(normalized['cupocredito'] || normalized['cupo'] || normalized['limite'] || 1000000).replace(/[^0-9.]/g, '')) || 1000000
    );

    const creditUsed = Math.max(
      0,
      Number(String(normalized['deudaactual'] || normalized['deuda'] || normalized['saldodeudor'] || 0).replace(/[^0-9.]/g, '')) || 0
    );

    const balance = Math.max(
      0,
      Number(String(normalized['saldodisponible'] || normalized['saldo'] || 0).replace(/[^0-9.]/g, '')) || 0
    );

    const loanQuota = Math.max(
      0,
      Number(String(normalized['cuotomensual'] || normalized['cuota'] || 1250000).replace(/[^0-9.]/g, '')) || 1250000
    );

    const loanQuotasTotal = Math.max(
      1,
      Number(String(normalized['cuotastotales'] || normalized['numerocuotas'] || normalized['cuotas'] || 12).replace(/[^0-9]/g, '')) || 12
    );

    const paymentTermDays = Math.max(
      1,
      Number(String(normalized['plazodias'] || normalized['plazo'] || normalized['dias'] || 30).replace(/[^0-9]/g, '')) || 30
    );

    const dailyInterestRate = Math.max(
      0,
      Number(String(normalized['tasadiariapct'] || normalized['tasadiaria'] || normalized['tasa'] || 0.5).replace(/[^0-9.]/g, '')) || 0.5
    );

    const pin = String(normalized['pin'] || normalized['clave'] || normalized['nip'] || '1234').trim().slice(0, 8);

    const rawStatus = String(normalized['estado'] || normalized['status'] || 'active').toLowerCase().trim();
    let status: 'active' | 'blocked' | 'pending' = 'active';
    if (rawStatus.includes('mora') || rawStatus.includes('pending') || rawStatus.includes('pendiente')) {
      status = 'pending';
    } else if (rawStatus.includes('bloq') || rawStatus.includes('cancel') || rawStatus.includes('inactiv') || rawStatus.includes('blocked')) {
      status = 'blocked';
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newClabe = `63818000${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const user: User = {
      id: `usr_client_${Date.now()}_${index}_${randomSuffix}`,
      name: String(name).trim(),
      cedula,
      email,
      phone,
      clabe: newClabe,
      cpfOrClabe: newClabe,
      accountNumber: newClabe.slice(-10),
      pin,
      role: 'client',
      status,
      balance,
      creditLimit,
      creditUsed,
      createdAt: new Date().toISOString().split('T')[0],
      loanQuota,
      loanQuotasTotal,
      dailyInterestRate,
      paymentTermDays,
    };

    results.push({
      isValid: true,
      errors: [],
      user,
      rawData: row,
    });
  });

  return results;
};
