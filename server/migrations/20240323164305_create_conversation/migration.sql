-- CreateTable
CREATE TABLE `Conversation`
(
    `owner_id`      UUID NOT NULL,
    `target_id`     UUID NOT NULL,
    `last_interact` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP (3),

    PRIMARY KEY (`owner_id`, `target_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Conversation`
    ADD CONSTRAINT `Conversation_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `Conversation`
    ADD CONSTRAINT `Conversation_target_id_fkey` FOREIGN KEY (`target_id`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
