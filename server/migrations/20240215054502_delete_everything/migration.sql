/*
  Warnings:

  - You are about to drop the `Attachment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Ban` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Block` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Follow` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Moderator` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PushNotification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sub` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TopPost` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Vote` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Attachment` DROP FOREIGN KEY `Attachment_top_post_id_fkey`;

-- DropForeignKey
ALTER TABLE `Ban` DROP FOREIGN KEY `Ban_sub_id_fkey`;

-- DropForeignKey
ALTER TABLE `Ban` DROP FOREIGN KEY `Ban_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `Block` DROP FOREIGN KEY `Block_blocked_id_fkey`;

-- DropForeignKey
ALTER TABLE `Block` DROP FOREIGN KEY `Block_blocker_id_fkey`;

-- DropForeignKey
ALTER TABLE `Follow` DROP FOREIGN KEY `Follow_sub_id_fkey`;

-- DropForeignKey
ALTER TABLE `Follow` DROP FOREIGN KEY `Follow_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `Moderator` DROP FOREIGN KEY `Moderator_sub_id_fkey`;

-- DropForeignKey
ALTER TABLE `Moderator` DROP FOREIGN KEY `Moderator_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_author_id_fkey`;

-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_parent_id_fkey`;

-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_sub_id_fkey`;

-- DropForeignKey
ALTER TABLE `Post` DROP FOREIGN KEY `Post_top_post_id_fkey`;

-- DropForeignKey
ALTER TABLE `PushNotification` DROP FOREIGN KEY `PushNotification_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `Session` DROP FOREIGN KEY `Session_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `Vote` DROP FOREIGN KEY `Vote_post_id_fkey`;

-- DropForeignKey
ALTER TABLE `Vote` DROP FOREIGN KEY `Vote_user_id_fkey`;

-- DropTable
DROP TABLE `Attachment`;

-- DropTable
DROP TABLE `Ban`;

-- DropTable
DROP TABLE `Block`;

-- DropTable
DROP TABLE `Follow`;

-- DropTable
DROP TABLE `Moderator`;

-- DropTable
DROP TABLE `Post`;

-- DropTable
DROP TABLE `PushNotification`;

-- DropTable
DROP TABLE `Session`;

-- DropTable
DROP TABLE `Sub`;

-- DropTable
DROP TABLE `TopPost`;

-- DropTable
DROP TABLE `User`;

-- DropTable
DROP TABLE `Vote`;
