/*
  Warnings:

  - You are about to drop the `HomepageSection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "HomepageSection";

-- CreateTable
CREATE TABLE "homepage_section" (
    "id" SERIAL NOT NULL,
    "hero_banner" JSONB,
    "features_bar" JSONB,
    "best_sellers" JSONB,
    "premium_wines" JSONB,
    "wine_lounge" JSONB,
    "upcoming_events" JSONB,
    "beers_spirits" JSONB,
    "our_story" JSONB,
    "customer_reviews" JSONB,
    "store_locations" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_section_pkey" PRIMARY KEY ("id")
);
