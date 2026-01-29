

-- ============================================================================
-- TRIGGER: Validar reglas de negocio
-- ============================================================================

CREATE OR REPLACE FUNCTION configuracion.trg_validar_usuarios_puntos()
RETURNS TRIGGER AS $$
DECLARE
    v_count INT;
BEGIN
    -- Validar que solo haya un punto activo por usuario-empresa
    IF NEW.activo = true THEN
        SELECT COUNT(*) INTO v_count
        FROM configuracion.usuarios_puntos_emision
        WHERE usuario_id = NEW.usuario_id
        AND empresa_id = NEW.empresa_id
        AND activo = true
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
        
        IF v_count > 0 THEN
            RAISE EXCEPTION 'El usuario ya tiene un punto de emisión activo. Desactívelo primero.';
        END IF;
    END IF;
    
    -- Validar que solo haya un punto principal por usuario-empresa
    IF NEW.es_principal = true THEN
        SELECT COUNT(*) INTO v_count
        FROM configuracion.usuarios_puntos_emision
        WHERE usuario_id = NEW.usuario_id
        AND empresa_id = NEW.empresa_id
        AND es_principal = true
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
        
        IF v_count > 0 THEN
            RAISE EXCEPTION 'El usuario ya tiene un punto de emisión principal. Desmarque el otro primero.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION configuracion.trg_validar_usuarios_puntos IS 
'Valida que solo haya un punto activo y un punto principal por usuario-empresa';

CREATE TRIGGER trigger_validar_usuarios_puntos
    BEFORE INSERT OR UPDATE ON configuracion.usuarios_puntos_emision
    FOR EACH ROW
    EXECUTE FUNCTION configuracion.trg_validar_usuarios_puntos();

COMMENT ON TRIGGER trigger_validar_usuarios_puntos ON configuracion.usuarios_puntos_emision IS 
'Valida reglas de negocio antes de insertar o actualizar';


-- ============================================================================
-- FIN DE MIGRATION 008
-- ============================================================================
