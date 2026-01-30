-- CreateEnum
CREATE TYPE "ShippingMethodType" AS ENUM ('standard', 'express', 'overnight', 'same_day', 'pickup');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shipping_method_id" INTEGER;

-- CreateTable
CREATE TABLE "ShippingMethod" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "type" "ShippingMethodType" NOT NULL,
    "description" TEXT,
    "baseRate" DOUBLE PRECISION NOT NULL,
    "free_threshold" DOUBLE PRECISION,
    "min_days" INTEGER NOT NULL,
    "max_days" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingMethod_code_key" ON "ShippingMethod"("code");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shipping_method_id_fkey" FOREIGN KEY ("shipping_method_id") REFERENCES "ShippingMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
