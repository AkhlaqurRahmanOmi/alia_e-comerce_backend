-- CreateTable
CREATE TABLE "HomepageSection" (
    "id" SERIAL NOT NULL,
    "section_key" VARCHAR(100) NOT NULL,
    "section_name" VARCHAR(255) NOT NULL,
    "section_type" VARCHAR(50) NOT NULL DEFAULT 'static',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 1,
    "content_data" JSONB,
    "meta_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" INTEGER,
    "updated_by_id" INTEGER,

    CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomepageSection_section_key_key" ON "HomepageSection"("section_key");

-- CreateIndex
CREATE INDEX "HomepageSection_is_active_display_order_idx" ON "HomepageSection"("is_active", "display_order");

-- CreateIndex
CREATE INDEX "HomepageSection_section_key_idx" ON "HomepageSection"("section_key");
