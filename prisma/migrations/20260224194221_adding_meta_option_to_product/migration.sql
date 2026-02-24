-- CreateEnum
CREATE TYPE "OptionDisplayType" AS ENUM ('text', 'color_swatch', 'image_swatch', 'pattern_swatch', 'number');

-- AlterTable
ALTER TABLE "OptionValue" ADD COLUMN     "meta" JSONB;

-- AlterTable
ALTER TABLE "ProductOption" ADD COLUMN     "display_type" "OptionDisplayType" NOT NULL DEFAULT 'text';

-- CreateIndex
CREATE INDEX "OptionValue_option_id_position_idx" ON "OptionValue"("option_id", "position");

-- CreateIndex
CREATE INDEX "OptionValue_option_id_value_idx" ON "OptionValue"("option_id", "value");

-- CreateIndex
CREATE INDEX "ProductOption_product_id_position_idx" ON "ProductOption"("product_id", "position");
