/*
  Warnings:

  - Added the required column `authorId` to the `starboard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `channelId` to the `starboard` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `starboard` ADD COLUMN `authorId` VARCHAR(191) NOT NULL,
    ADD COLUMN `channelId` VARCHAR(191) NOT NULL;
