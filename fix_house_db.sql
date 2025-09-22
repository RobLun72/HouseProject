-- Add Address column to Houses table
ALTER TABLE "Houses" ADD COLUMN "Address" text NOT NULL DEFAULT '';

-- Update Area column types and add new Room columns
ALTER TABLE "Houses" ALTER COLUMN "Area" TYPE numeric(10,2);
ALTER TABLE "Rooms" ALTER COLUMN "Area" TYPE numeric(10,2);
ALTER TABLE "Rooms" ADD COLUMN "Name" text NOT NULL DEFAULT '';
ALTER TABLE "Rooms" ADD COLUMN "Type" text NOT NULL DEFAULT '';

-- Insert migration history records
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") VALUES ('20250922084026_InitialCreate', '8.0.8');
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") VALUES ('20250922135844_AddAddressAndUpdatePropertyTypes', '8.0.8');

-- Update existing data with sample values
UPDATE "Houses" SET "Address" = CASE 
    WHEN "HouseId" = 1 THEN '123 Elm Street'
    WHEN "HouseId" = 2 THEN '456 Oak Avenue'
    WHEN "HouseId" = 3 THEN '789 Pine Road'
    ELSE 'Unknown Address'
END;

UPDATE "Rooms" SET 
    "Name" = CASE 
        WHEN "RoomId" = 1 THEN 'Living Room'
        WHEN "RoomId" = 2 THEN 'Master Bedroom'
        WHEN "RoomId" = 3 THEN 'Kitchen'
        WHEN "RoomId" = 4 THEN 'Office'
        ELSE 'Room ' || "RoomId"
    END,
    "Type" = CASE 
        WHEN "RoomId" = 1 THEN 'Living'
        WHEN "RoomId" = 2 THEN 'Bedroom'
        WHEN "RoomId" = 3 THEN 'Kitchen'
        WHEN "RoomId" = 4 THEN 'Office'
        ELSE 'General'
    END;