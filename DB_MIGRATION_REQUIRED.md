# ⚠️ DATABASE MIGRATION REQUIRED

## The application will NOT work until you run this migration script!

### Problem
The `Ventas` table is missing the `MedioPagoID` column that was recently added.

### Solution
Run the following SQL script on your `DBStreamDoor` database:

```sql
-- Add MedioPagoID column to Ventas table (if it doesn't exist)
IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('Ventas') 
               AND name = 'MedioPagoID')
BEGIN
    ALTER TABLE Ventas 
    ADD MedioPagoID INT NULL;
    
    ALTER TABLE Ventas 
    ADD CONSTRAINT FK_Ventas_MediosPago 
        FOREIGN KEY (MedioPagoID) 
        REFERENCES MediosPago(MedioPagoID);
    
    PRINT 'MedioPagoID column added successfully to Ventas table';
END
ELSE
BEGIN
    PRINT 'MedioPagoID column already exists in Ventas table';
END
GO
```

### How to run this migration:

1. Open SQL Server Management Studio (SSMS)
2. Connect to your SQL Server instance
3. Select the `DBStreamDoor` database
4. Open a new query window
5. Copy and paste the script above
6. Execute (F5 or click Execute button)
7. Restart your application

### Alternative: Run the full database script

If you haven't created the database yet, run the complete script:
```
Consultas/database.sql
```

This script includes ALL tables and the MedioPagoID column is already included in the CREATE TABLE statement for Ventas.

---

**After running this migration, the 500 error will be resolved and you'll be able to:**
- ✅ Load the Ventas page
- ✅ See dropdowns for Servicios, Combos, and Medios de Pago
- ✅ Create new sales with payment method tracking
