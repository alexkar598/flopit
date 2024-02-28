/*
  Warnings:

  - The primary key for the `Ban` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
SET FOREIGN_KEY_CHECKS=0;
ALTER TABLE `Ban`
    DROP PRIMARY KEY,
    ADD COLUMN `id` UUID NOT NULL DEFAULT CAST(create_uuid7() AS CHAR(36)) PRIMARY KEY;
SET FOREIGN_KEY_CHECKS=1;