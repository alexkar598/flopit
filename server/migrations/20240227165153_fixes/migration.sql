/*
  Warnings:

  - You are about to alter the column `creation_time` on the `Session` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime`.

*/

-- AddForeignKey
ALTER TABLE `Ban` ADD CONSTRAINT `Ban_user_id_fkey_1` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
