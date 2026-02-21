-- ============================================
-- ROLLBACK SCRIPT - Phase 1: Cuentas Enhancement
-- ============================================
-- This script reverts changes made to Cuentas table
-- Run this only if you need to rollback Phase 1 changes
-- ============================================

USE DBStreamDoor;
GO

PRINT 'Starting rollback of Phase 1 changes...';
GO

-- Remove FechaFinalizacion from Cuentas if it exists
IF EXISTS (SELECT * FROM sys.columns 
           WHERE object_id = OBJECT_ID('Cuentas') 
           AND name = 'FechaFinalizacion')
BEGIN
    PRINT 'Removing FechaFinalizacion column from Cuentas...';
    ALTER TABLE Cuentas DROP COLUMN FechaFinalizacion;
    PRINT 'FechaFinalizacion column removed successfully.';
END
ELSE
BEGIN
    PRINT 'FechaFinalizacion column does not exist. Nothing to rollback.';
END
GO

PRINT 'Phase 1 rollback completed.';
GO
