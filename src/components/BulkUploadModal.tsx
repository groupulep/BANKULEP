import React, { useState, useRef } from 'react';
import { User } from '../types';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Users,
  Check,
  AlertCircle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { parseBulkClientsFile, downloadBulkUploadTemplate, ParsedClientRow } from '../utils/excelHelper';

interface BulkUploadModalProps {
  isOpen: boolean;
  existingUsers: User[];
  onClose: () => void;
  onConfirmImport: (newUsers: User[], updateExisting: boolean) => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  existingUsers,
  onClose,
  onConfirmImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedClientRow[]>([]);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelected = async (selectedFile: File) => {
    setErrorMsg(null);
    if (
      !selectedFile.name.endsWith('.xlsx') &&
      !selectedFile.name.endsWith('.xls') &&
      !selectedFile.name.endsWith('.csv')
    ) {
      setErrorMsg('Por favor sube un archivo válido en formato Excel (.xlsx, .xls) o CSV (.csv)');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const rows = await parseBulkClientsFile(selectedFile);
      if (rows.length === 0) {
        setErrorMsg('El archivo no contiene filas o datos legibles.');
      }
      setParsedRows(rows);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Hubo un error al leer el archivo Excel. Verifica que no esté dañado.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const resetState = () => {
    setFile(null);
    setParsedRows([]);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validRows = parsedRows.filter((r) => r.isValid && r.user);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  // Existing cédula detection
  const existingCedulaSet = new Set(existingUsers.map((u) => u.cedula));
  const duplicateCedulasCount = validRows.filter((r) => r.user && existingCedulaSet.has(r.user.cedula)).length;

  const totalNewCredit = validRows.reduce((acc, r) => acc + (r.user?.creditLimit || 0), 0);
  const totalNewDebt = validRows.reduce((acc, r) => acc + (r.user?.creditUsed || 0), 0);

  const handleConfirm = () => {
    const usersToImport = validRows.map((r) => r.user!).filter(Boolean);
    onConfirmImport(usersToImport, updateExisting);
    resetState();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-purple-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-800/60 border border-purple-700/60 flex items-center justify-center text-purple-200">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">Carga Masiva de Clientes</h2>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Importa múltiples clientes simultáneamente desde un archivo Excel o CSV
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              resetState();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Download Template Banner */}
          <div className="bg-purple-50/70 border border-purple-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-purple-950">¿No tienes el formato oficial?</h3>
                <p className="text-[11px] text-slate-600">
                  Descarga la plantilla oficial en Excel con las columnas estructuradas e instrucciones.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={downloadBulkUploadTemplate}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-purple-950 hover:bg-purple-900 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Plantilla</span>
            </button>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Upload Area if no file loaded */}
          {!file && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-purple-600 bg-purple-50 scale-[1.01]'
                  : 'border-purple-200 hover:border-purple-400 bg-purple-50/30 hover:bg-purple-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-800 mx-auto flex items-center justify-center mb-3.5 shadow-xs">
                <Upload className="w-8 h-8" />
              </div>

              <h3 className="text-sm sm:text-base font-black text-purple-950">
                Arrastra y suelta tu archivo Excel o CSV aquí
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                O haz clic para explorar tus archivos en el computador. Formatos permitidos: <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>
              </p>

              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-xs">
                <span>Seleccionar Archivo</span>
              </div>
            </div>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-purple-950">Procesando y validando filas del Excel...</p>
            </div>
          )}

          {/* File Loaded & Preview */}
          {file && !isProcessing && (
            <div className="space-y-4">
              {/* File details bar */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">{file.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} filas detectadas
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetState}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cambiar Archivo</span>
                </button>
              </div>

              {/* Stats of parsed rows */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-purple-50/80 border border-purple-200 p-3 rounded-2xl">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Filas Totales</p>
                  <p className="text-lg font-black font-mono text-purple-950">{parsedRows.length}</p>
                </div>
                <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-2xl">
                  <p className="text-[10px] uppercase font-bold text-emerald-700">Válidos para Cargar</p>
                  <p className="text-lg font-black font-mono text-emerald-800">{validRows.length}</p>
                </div>
                <div className="bg-purple-50/80 border border-purple-200 p-3 rounded-2xl">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Cupo Total a Asignar</p>
                  <p className="text-sm font-black font-mono text-purple-950">
                    ${(totalNewCredit / 1000000).toFixed(2)}M <span className="text-[10px]">COP</span>
                  </p>
                </div>
                <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-2xl">
                  <p className="text-[10px] uppercase font-bold text-amber-800">Deuda Inicial Total</p>
                  <p className="text-sm font-black font-mono text-amber-900">
                    ${(totalNewDebt / 1000000).toFixed(2)}M <span className="text-[10px]">COP</span>
                  </p>
                </div>
              </div>

              {/* Duplicate alert */}
              {duplicateCedulasCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">
                      Se detectaron {duplicateCedulasCount} cédula(s) que ya existen en el sistema.
                    </p>
                    <label className="flex items-center gap-2 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={updateExisting}
                        onChange={(e) => setUpdateExisting(e.target.checked)}
                        className="w-4 h-4 accent-purple-800 rounded"
                      />
                      <span className="text-[11px] font-medium text-amber-950">
                        Actualizar datos (cupo, deuda, teléfono) de los clientes existentes
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Invalid Rows notice */}
              {invalidRows.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">
                      {invalidRows.length} fila(s) omitida(s) por falta de Nombre o Cédula:
                    </p>
                    <ul className="list-disc pl-4 mt-1 text-[11px] space-y-0.5">
                      {invalidRows.slice(0, 3).map((r, idx) => (
                        <li key={idx}>
                          Fila: {r.errors.join(', ')} ({JSON.stringify(r.rawData)})
                        </li>
                      ))}
                      {invalidRows.length > 3 && <li>...y {invalidRows.length - 3} más</li>}
                    </ul>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                    Vista Previa de Clientes a Importar ({validRows.length})
                  </h4>
                </div>

                <div className="border border-purple-100 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-purple-50 text-purple-950 font-black uppercase tracking-wider sticky top-0 border-b border-purple-100">
                      <tr>
                        <th className="py-2.5 px-3">Cliente</th>
                        <th className="py-2.5 px-3">Cédula</th>
                        <th className="py-2.5 px-3">Cupo</th>
                        <th className="py-2.5 px-3">Deuda</th>
                        <th className="py-2.5 px-3">Cuota</th>
                        <th className="py-2.5 px-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-50 bg-white">
                      {validRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            No se identificaron clientes válidos para importar.
                          </td>
                        </tr>
                      ) : (
                        validRows.map((r, i) => {
                          const u = r.user!;
                          const isAlreadyInDb = existingCedulaSet.has(u.cedula);
                          return (
                            <tr key={i} className="hover:bg-purple-50/30">
                              <td className="py-2 px-3">
                                <span className="font-extrabold text-purple-950">{u.name}</span>
                                {isAlreadyInDb && (
                                  <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                                    Existente
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono text-purple-900 font-bold">{u.cedula}</td>
                              <td className="py-2 px-3 font-mono font-bold">${u.creditLimit.toLocaleString('es-CO')}</td>
                              <td className="py-2 px-3 font-mono font-bold text-amber-800">
                                ${u.creditUsed.toLocaleString('es-CO')}
                              </td>
                              <td className="py-2 px-3 font-mono">${(u.loanQuota ?? 1250000).toLocaleString('es-CO')}</td>
                              <td className="py-2 px-3">
                                <span
                                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    u.status === 'active'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : u.status === 'pending'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {u.status === 'active' ? 'Activo' : u.status === 'pending' ? 'Mora' : 'Cancelado'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              resetState();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={validRows.length === 0 || isProcessing}
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer ${
              validRows.length > 0 && !isProcessing
                ? 'bg-purple-950 hover:bg-purple-900 text-white hover:scale-102 active:scale-98'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Confirmar e Importar {validRows.length} Clientes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
