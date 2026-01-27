/**
 * Constantes para los servicios del SRI (Servicio de Rentas Internas)
 */

export enum SriEnvironment {
    PRUEBAS = 'PRUEBAS',
    PRODUCCION = 'PRODUCCION'
}

export const SRI_URLS = {
    [SriEnvironment.PRUEBAS]: {
        recepcion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
        autorizacion: 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
    },
    [SriEnvironment.PRODUCCION]: {
        recepcion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
        autorizacion: 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
    }
};
