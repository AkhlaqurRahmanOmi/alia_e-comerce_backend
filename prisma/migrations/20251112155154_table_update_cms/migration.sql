/*
  Warnings:

  - You are about to drop the column `beers_spirits` on the `homepage_section` table. All the data in the column will be lost.
  - You are about to drop the column `best_sellers` on the `homepage_section` table. All the data in the column will be lost.
  - You are about to drop the column `customer_reviews` on the `homepage_section` table. All the data in the column will be lost.
  - You are about to drop the column `premium_wines` on the `homepage_section` table. All the data in the column will be lost.
  - You are about to drop the column `upcoming_events` on the `homepage_section` table. All the data in the column will be lost.
  - You are about to drop the column `wine_lounge` on the `homepage_section` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "homepage_section" DROP COLUMN "beers_spirits",
DROP COLUMN "best_sellers",
DROP COLUMN "customer_reviews",
DROP COLUMN "premium_wines",
DROP COLUMN "upcoming_events",
DROP COLUMN "wine_lounge",
ADD COLUMN     "footer" JSONB,
ADD COLUMN     "header" JSONB;
