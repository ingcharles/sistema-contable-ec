import { ShieldAlert, Monitor, Globe, Server } from 'lucide-react';
import { LogAuditoria, NivelSeveridad } from '../../domain/types';
import { Modal } from '@/shared/ui/Modal';
import { ModalFooter } from '@/shared/ui/ModalFooter';

interface LogDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    log: LogAuditoria | null;
}

export const LogDetailsModal = ({ isOpen, onClose, log }: LogDetailsModalProps) => {
    if (!log) return null;

    const formatJson = (data: any) => {
        if (!data) return <span className="text-gray-400 italic">Sin datos</span>;
        try {
            const obj = typeof data === 'string' ? JSON.parse(data) : data;
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            return String(data);
        }
    };

    const getSeveridadColor = (severidad: string) => {
        switch (severidad) {
            case NivelSeveridad.CRITICAL: return 'bg-red-100 text-red-700 border-red-200';
            case NivelSeveridad.WARNING: return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-green-100 text-green-700 border-green-200';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Detalle de Auditoría"
            description={log.id}
            icon={<ShieldAlert />}
            size="xl"
            footer={
                <ModalFooter
                    onCancel={onClose}
                    cancelLabel="Cerrar"
                // No submit action
                />
            }
        >
            <div className="space-y-6">
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Monitor size={16} />
                            <span className="text-xs font-semibold uppercase tracking-wider">Usuario</span>
                        </div>
                        <p className="font-medium text-slate-800">{log.usuario_nombre || 'Sistema'}</p>
                        <p className="text-xs text-slate-500">{log.usuario}</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Globe size={16} />
                            <span className="text-xs font-semibold uppercase tracking-wider">Origen</span>
                        </div>
                        <p className="font-medium text-slate-800">{log.ip_address || log.ip || 'N/A'}</p>
                        <p className="text-xs text-slate-500">{log.metodo_http} {log.ruta}</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Server size={16} />
                            <span className="text-xs font-semibold uppercase tracking-wider">Módulo / Evento</span>
                        </div>
                        <p className="font-medium text-slate-800">{log.modulo}</p>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getSeveridadColor(log.severidad)}`}>
                            {log.evento}
                        </span>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Descripción</h4>
                    <p className="text-gray-600 bg-white p-3 border rounded-lg shadow-sm">
                        {log.descripcion || 'Sin descripción'}
                    </p>
                </div>

                {/* Diff Viewer */}
                {(log.datos_antes || log.datos_despues) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-xs font-bold text-red-500 uppercase mb-2 flex items-center justify-between">
                                <span>Antes (Pre-Cambio)</span>
                            </h4>
                            <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto border border-slate-800 shadow-inner">
                                <pre className="text-xs text-red-300 font-mono leading-relaxed">
                                    {formatJson(log.datos_antes)}
                                </pre>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-green-500 uppercase mb-2 flex items-center justify-between">
                                <span>Después (Post-Cambio)</span>
                            </h4>
                            <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto border border-slate-800 shadow-inner">
                                <pre className="text-xs text-green-300 font-mono leading-relaxed">
                                    {formatJson(log.datos_despues)}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
