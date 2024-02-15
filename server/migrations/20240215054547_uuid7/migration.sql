CREATE OR REPLACE FUNCTION create_uuid7 RETURNS STRING SONAME "flopit_udf.so";

-- CreateTable
CREATE TABLE `User` (
                        `id` UUID NOT NULL DEFAULT CAST(create_uuid7() AS CHAR(36)),
                        `username` VARCHAR(64) NOT NULL,
                        `email` VARCHAR(320) NOT NULL,
                        `password` BINARY(255) NOT NULL,
                        `salt` BINARY(32) NOT NULL,
                        `avatar_oid` CHAR(40) NULL,
                        `theme` ENUM('Light', 'Dark') NOT NULL DEFAULT 'Dark',
                        `notifications` BIT(1) NOT NULL,

                        UNIQUE INDEX `User_username_key`(`username`),
                        UNIQUE INDEX `User_email_key`(`email`),
                        PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
                           `id` UUID NOT NULL DEFAULT CAST(create_uuid7() AS CHAR(36)),
                           `user_id` UUID NOT NULL,
                           `creation_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                           `revocation_time` DATETIME(3) NULL,

                           INDEX `Session_user_id_revocation_time_creation_time_idx`(`user_id`, `revocation_time`, `creation_time`),
                           PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PushNotification` (
                                    `id` UUID NOT NULL DEFAULT CAST(create_uuid7() AS CHAR(36)),
                                    `user_id` UUID NOT NULL,
                                    `endpoint` VARCHAR(512) NOT NULL,
                                    `expiration_time` DATETIME(3) NULL,
                                    `p256dh` BINARY(65) NOT NULL,
                                    `auth` BINARY(16) NOT NULL,

                                    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Block` (
                         `blocked_id` UUID NOT NULL,
                         `blocker_id` UUID NOT NULL,

                         PRIMARY KEY (`blocked_id`, `blocker_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sub` (
                       `id` UUID NOT NULL DEFAULT CAST(create_uuid7() AS CHAR(36)),
                       `name` VARCHAR(64) NOT NULL,
                       `description` VARCHAR(512) NOT NULL DEFAULT '',
                       `icon_oid` CHAR(40) NULL,
                       `banner_oid` CHAR(40) NULL,

                       UNIQUE INDEX `Sub_name_key`(`name`),
                       FULLTEXT INDEX `Sub_description_idx`(`description`),
                       PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Moderator` (
                             `user_id` UUID NOT NULL,
                             `sub_id` UUID NOT NULL,

                             PRIMARY KEY (`user_id`, `sub_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ban` (
                       `user_id` UUID NOT NULL,
                       `sub_id` UUID NOT NULL,
                       `reason` VARCHAR(512) NOT NULL,
                       `expiry` DATETIME(3) NOT NULL,

                       PRIMARY KEY (`user_id`, `sub_id`, `expiry`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Follow` (
                          `user_id` UUID NOT NULL,
                          `sub_id` UUID NOT NULL,

                          PRIMARY KEY (`user_id`, `sub_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopPost` (
                           `id` UUID NOT NULL DEFAULT CAST(create_uuid7() AS CHAR(36)),
                           `title` VARCHAR(256) NOT NULL,

                           FULLTEXT INDEX `TopPost_title_idx`(`title`),
                           PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
                        `id` UUID NOT NULL DEFAULT CAST(create_uuid7() AS CHAR(36)),
                        `sub_id` UUID NOT NULL,
                        `author_id` UUID NULL,
                        `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                        `text_content` TEXT NOT NULL,
                        `delta_content` JSON NOT NULL,
                        `top_post_id` UUID NOT NULL,
                        `parent_id` UUID NULL,
                        `cached_votes` BIGINT NOT NULL,

                        INDEX `Post_sub_id_parent_id_created_at_idx`(`sub_id`, `parent_id`, `created_at`),
                        INDEX `Post_sub_id_parent_id_cached_votes_idx`(`sub_id`, `parent_id`, `cached_votes`),
                        INDEX `Post_parent_id_created_at_idx`(`parent_id`, `created_at`),
                        INDEX `Post_parent_id_cached_votes_idx`(`parent_id`, `cached_votes`),
                        FULLTEXT INDEX `Post_text_content_idx`(`text_content`),
                        PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attachment` (
                              `top_post_id` UUID NOT NULL,
                              `order` TINYINT UNSIGNED NOT NULL,
                              `type` ENUM('Image', 'Video', 'Link') NOT NULL,
                              `content` VARCHAR(2048) NOT NULL,

                              PRIMARY KEY (`top_post_id`, `order`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vote` (
                        `id` UUID NOT NULL DEFAULT CAST(create_uuid7() AS CHAR(36)),
                        `user_id` UUID NULL,
                        `post_id` UUID NOT NULL,
                        `value` TINYINT NOT NULL,

                        INDEX `Vote_user_id_post_id_value_idx`(`user_id`, `post_id`, `value`),
                        UNIQUE INDEX `Vote_user_id_post_id_key`(`user_id`, `post_id`),
                        PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `PushNotification` ADD CONSTRAINT `PushNotification_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Block` ADD CONSTRAINT `Block_blocked_id_fkey` FOREIGN KEY (`blocked_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Block` ADD CONSTRAINT `Block_blocker_id_fkey` FOREIGN KEY (`blocker_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Moderator` ADD CONSTRAINT `Moderator_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Moderator` ADD CONSTRAINT `Moderator_sub_id_fkey` FOREIGN KEY (`sub_id`) REFERENCES `Sub`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Ban` ADD CONSTRAINT `Ban_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Ban` ADD CONSTRAINT `Ban_sub_id_fkey` FOREIGN KEY (`sub_id`) REFERENCES `Sub`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Follow` ADD CONSTRAINT `Follow_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Follow` ADD CONSTRAINT `Follow_sub_id_fkey` FOREIGN KEY (`sub_id`) REFERENCES `Sub`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_sub_id_fkey` FOREIGN KEY (`sub_id`) REFERENCES `Sub`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_top_post_id_fkey` FOREIGN KEY (`top_post_id`) REFERENCES `TopPost`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Attachment` ADD CONSTRAINT `Attachment_top_post_id_fkey` FOREIGN KEY (`top_post_id`) REFERENCES `TopPost`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
