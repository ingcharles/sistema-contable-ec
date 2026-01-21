import { useState, useEffect } from 'react';
import { Settings, Building2, Monitor, Database, Save, Plus, Edit2, Trash2, Shield, Key, CalendarOff, Upload, CheckCircle2, Eye, EyeOff, AlertTriangle, Lock } from 'lucide-react';

// Helper function to convert File to base64
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const bytes = new Uint8Array(arrayBuffer);
            const binary = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
            resolve(btoa(binary));
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

export { fileToBase64 };
