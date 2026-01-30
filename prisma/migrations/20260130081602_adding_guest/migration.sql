-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_user_id_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "guest_email" VARCHAR(255),
ADD COLUMN     "guest_first_name" VARCHAR(50),
ADD COLUMN     "guest_last_name" VARCHAR(50),
ADD COLUMN     "guest_phone" VARCHAR(20),
ADD COLUMN     "is_guest_order" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Order_user_id_idx" ON "Order"("user_id");

-- CreateIndex
CREATE INDEX "Order_guest_email_idx" ON "Order"("guest_email");

-- CreateIndex
CREATE INDEX "Order_is_guest_order_idx" ON "Order"("is_guest_order");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
