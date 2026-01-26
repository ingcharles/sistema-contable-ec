import { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Plus, Edit2, Trash2 } from 'lucide-react';
import { CuentaContable } from '@/shared/types';
import { NuevaCuentaModal } from './NuevaCuentaModal';
import { EditarCuentaModal } from './EditarCuentaModal';
import { useTodasLasCuentas, useContabilidadMutations } from '../../hooks/useContabilidad';
import { useToast } from '@/shared/context/ToastContext';
import { formatMoney } from '@/shared/utils/formatearDinero';

interface TreeNode extends CuentaContable {
    children: TreeNode[];
}

export const PlanCuentasTree = () => {
    const { cuentas, cargarTodasLasCuentas } = useTodasLasCuentas();
    const { guardarCuenta, eliminarCuenta } = useContabilidadMutations();
    const { showToast } = useToast();

    const [expanded, setExpanded] = useState<Record<string, boolean>>({ '1': true, '2': true, '3': true });
    const [showNuevaCuenta, setShowNuevaCuenta] = useState(false);
    const [showEditarCuenta, setShowEditarCuenta] = useState(false);
    const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaContable | null>(null);
    const [cuentaPadre, setCuentaPadre] = useState<CuentaContable | undefined>(undefined);


    useEffect(() => {

        cargarTodasLasCuentas();
        // console.log('cuentas', cuentas);
    }, [cargarTodasLasCuentas]);

    const treeData = useMemo(() => {
        const buildTree = (items: CuentaContable[]): TreeNode[] => {
            const rootItems: TreeNode[] = [];
            const lookup: Record<string, TreeNode> = {};

            if (!Array.isArray(items)) return [];

            // Initialize lookup
            items.forEach(item => {
                lookup[item.codigo] = { ...item, children: [] };
            });

            // Build tree
            items.forEach(item => {
                const node = lookup[item.codigo];
                const parts = item.codigo.split('.');
                if (parts.length > 1) {
                    parts.pop();
                    const parentCode = parts.join('.');
                    if (lookup[parentCode]) {
                        lookup[parentCode].children.push(node);
                    } else {
                        rootItems.push(node);
                    }
                } else {
                    rootItems.push(node);
                }
            });

            return rootItems;
        };

        return buildTree(cuentas);
    }, [cuentas]);

    const toggleExpand = (codigo: string) => {
        setExpanded(prev => ({ ...prev, [codigo]: !prev[codigo] }));
    };

    const handleNuevaCuenta = (padre?: CuentaContable) => {
        setCuentaPadre(padre);
        setShowNuevaCuenta(true);
    };

    const handleEditarCuenta = (cuenta: CuentaContable) => {
        setCuentaSeleccionada(cuenta);
        setShowEditarCuenta(true);
    };

    const handleSaveNuevaCuenta = async (cuenta: CuentaContable) => {
        try {
            await guardarCuenta(cuenta);
            await cargarTodasLasCuentas();
            setShowNuevaCuenta(false);
            showToast(`Cuenta ${cuenta.codigo} - ${cuenta.nombre} creada exitosamente`, 'success');
        } catch (error) {
            showToast('Error al crear la cuenta', 'error');
        }
    };

    const handleSaveEditarCuenta = async (cuenta: CuentaContable) => {
        try {
            await guardarCuenta(cuenta);
            await cargarTodasLasCuentas();
            setShowEditarCuenta(false);
            showToast(`Cuenta ${cuenta.codigo} actualizada exitosamente`, 'success');
        } catch (error) {
            showToast('Error al actualizar la cuenta', 'error');
        }
    };

    const handleEliminarCuenta = async (cuenta: CuentaContable) => {
        if (confirm(`¿Está seguro de eliminar la cuenta ${cuenta.codigo} - ${cuenta.nombre}?`)) {
            try {
                await eliminarCuenta(cuenta.codigo);
                await cargarTodasLasCuentas();
                showToast(`Cuenta ${cuenta.codigo} eliminada exitosamente`, 'success');
            } catch (error) {
                showToast('Error al eliminar la cuenta', 'error');
            }
        }
    };

    const renderNode = (node: TreeNode) => {
        const isExpanded = expanded[node.codigo];
        const hasChildren = node.children.length > 0;

        return (
            <div key={node.codigo} className="select-none">
                <div
                    className={`flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg transition-colors group ${node.nivel === 1 ? 'bg-slate-50/50 mb-1' : ''}`}
                    style={{ paddingLeft: `${(node.nivel - 1) * 1.5 + 0.5}rem` }}
                >
                    <button
                        onClick={() => toggleExpand(node.codigo)}
                        className={`p-1 rounded hover:bg-slate-200 text-slate-400 ${hasChildren ? 'visible' : 'invisible'}`}
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>

                    <div className={`p-1.5 rounded-lg ${hasChildren ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                        {hasChildren ? <Folder size={16} /> : <FileText size={16} />}
                    </div>

                    <div className="flex-1 flex items-center justify-between">
                        <div>
                            <span className="font-mono text-xs font-bold text-slate-500 mr-2">{node.codigo}</span>
                            <span className={`text-sm ${node.nivel === 1 ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>
                                {node.nombre}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="font-mono text-xs font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded">
                                {formatMoney(node.saldo)}
                            </span>
                            <span className="text-xs font-mono text-slate-400">{node.tipo}</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleNuevaCuenta(node)}
                                    className="p-1 text-slate-400 hover:text-sri-blue hover:bg-blue-50 rounded"
                                    title="Agregar Subcuenta"
                                >
                                    <Plus size={14} />
                                </button>
                                <button
                                    onClick={() => handleEditarCuenta(node)}
                                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                                    title="Editar"
                                >
                                    <Edit2 size={14} />
                                </button>
                                {!hasChildren && (
                                    <button
                                        onClick={() => handleEliminarCuenta(node)}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                        title="Eliminar"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {isExpanded && hasChildren && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                        {node.children.map(child => renderNode(child))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-700">Plan de Cuentas Jerárquico</h3>
                    <button
                        onClick={() => handleNuevaCuenta()}
                        className="text-sm text-sri-blue hover:underline font-medium flex items-center gap-1"
                    >
                        <Plus size={16} /> Nueva Cuenta Principal
                    </button>
                </div>
                <div className="p-2">
                    {treeData.map(node => renderNode(node))}
                </div>
            </div>

            {showNuevaCuenta && (
                <NuevaCuentaModal
                    onClose={() => {
                        setShowNuevaCuenta(false);
                        setCuentaPadre(undefined);
                    }}
                    onSave={handleSaveNuevaCuenta}
                    cuentaPadre={cuentaPadre}
                />
            )}

            {showEditarCuenta && cuentaSeleccionada && (
                <EditarCuentaModal
                    cuenta={cuentaSeleccionada}
                    onClose={() => {
                        setShowEditarCuenta(false);
                        setCuentaSeleccionada(null);
                    }}
                    onSave={handleSaveEditarCuenta}
                />
            )}
        </>
    );
};
