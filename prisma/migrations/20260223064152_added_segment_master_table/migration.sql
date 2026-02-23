-- CreateTable
CREATE TABLE "Segment" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSegment" (
    "product_id" INTEGER NOT NULL,
    "segment_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSegment_pkey" PRIMARY KEY ("product_id","segment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Segment_key_key" ON "Segment"("key");

-- CreateIndex
CREATE INDEX "Segment_is_active_position_idx" ON "Segment"("is_active", "position");

-- CreateIndex
CREATE INDEX "ProductSegment_segment_id_idx" ON "ProductSegment"("segment_id");

-- AddForeignKey
ALTER TABLE "ProductSegment" ADD CONSTRAINT "ProductSegment_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSegment" ADD CONSTRAINT "ProductSegment_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "Segment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
