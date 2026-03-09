/*
  Warnings:

  - You are about to drop the column `media_carousel` on the `homepage_section` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "homepage_section" DROP COLUMN "media_carousel",
ADD COLUMN     "media_carousel_primary" JSONB,
ADD COLUMN     "media_carousel_secondary" JSONB,
ADD COLUMN     "media_carousel_tertiary" JSONB;
