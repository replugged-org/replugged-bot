-- CreateTable
CREATE TABLE `starboard` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `starcount` INTEGER NOT NULL,

    UNIQUE INDEX `starboard_id_key`(`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
