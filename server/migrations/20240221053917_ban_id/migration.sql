/*
  Warnings:

  - The primary key for the `Ban` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
SET FOREIGN_KEY_CHECKS=0;
ALTER TABLE `Ban`
    DROP CONSTRAINT `Ban_user_id_fkey`;
ALTER TABLE `Ban`
    DROP PRIMARY KEY,
    ADD COLUMN `id` UUID NOT NULL DEFAULT CAST(create_uuid7() AS CHAR(36)) PRIMARY KEY;
ALTER TABLE `Ban`
    ADD CONSTRAINT `Ban_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
SET FOREIGN_KEY_CHECKS=1;