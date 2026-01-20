export const TransportistaUseCases = {
    async listar() {
        const response = await fetch('/api/transportistas');
        if (!response.ok) throw new Error('Error al listar transportistas');
        return await response.json();
    },

    async registrar(data: any) {
        const response = await fetch('/api/transportistas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Error al guardar transportista');
        return result.data;
    }
};
