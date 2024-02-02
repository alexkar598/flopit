-- CreateTable
CREATE TABLE `User` (
    `id` BIGINT UNSIGNED NOT NULL DEFAULT uuid_short(),
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
CREATE TABLE `PushNotification` (
    `id` BIGINT UNSIGNED NOT NULL DEFAULT uuid_short(),
    `user_id` BIGINT UNSIGNED NOT NULL,
    `endpoint` VARCHAR(512) NOT NULL,
    `expiration_time` DATETIME(3) NULL,
    `p256dh` BINARY(65) NOT NULL,
    `auth` BINARY(16) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Block` (
    `blocked_id` BIGINT UNSIGNED NOT NULL,
    `blocker_id` BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (`blocked_id`, `blocker_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sub` (
    `id` BIGINT UNSIGNED NOT NULL DEFAULT uuid_short(),
    `name` VARCHAR(64) NOT NULL,
    `description` VARCHAR(512) NOT NULL DEFAULT '',
    `icon_oid` CHAR(40) NULL,
    `banner_oid` CHAR(40) NULL,

    UNIQUE INDEX `Sub_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Moderator` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `sub_id` BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (`user_id`, `sub_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ban` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `sub_id` BIGINT UNSIGNED NOT NULL,
    `reason` VARCHAR(512) NOT NULL,
    `expiry` DATETIME(3) NOT NULL,

    PRIMARY KEY (`user_id`, `sub_id`, `expiry`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Follow` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `sub_id` BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (`user_id`, `sub_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopPost` (
    `id` BIGINT UNSIGNED NOT NULL DEFAULT uuid_short(),
    `title` VARCHAR(256) NOT NULL,

    FULLTEXT INDEX `TopPost_title_idx`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Post` (
    `id` BIGINT UNSIGNED NOT NULL DEFAULT uuid_short(),
    `sub_id` BIGINT UNSIGNED NOT NULL,
    `author_id` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `text_content` TEXT NOT NULL,
    `delta_content` JSON NOT NULL,
    `top_post_id` BIGINT UNSIGNED NOT NULL,
    `parent_id` BIGINT UNSIGNED NULL,
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
    `top_post_id` BIGINT UNSIGNED NOT NULL,
    `order` TINYINT UNSIGNED NOT NULL,
    `type` ENUM('Image', 'Video', 'Link') NOT NULL,
    `content` VARCHAR(2048) NOT NULL,

    PRIMARY KEY (`top_post_id`, `order`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vote` (
    `id` BIGINT UNSIGNED NOT NULL DEFAULT uuid_short(),
    `user_id` BIGINT UNSIGNED NULL,
    `post_id` BIGINT UNSIGNED NULL,
    `value` TINYINT NOT NULL,

    INDEX `Vote_user_id_post_id_value_idx`(`user_id`, `post_id`, `value`),
    UNIQUE INDEX `Vote_user_id_post_id_key`(`user_id`, `post_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
