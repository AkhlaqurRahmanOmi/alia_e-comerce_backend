-- DropForeignKey
ALTER TABLE "public"."CartItem" DROP CONSTRAINT "CartItem_cart_id_fkey";

-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_user_id_idx" ON "PasswordResetToken"("user_id");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expires_at_idx" ON "PasswordResetToken"("expires_at");

-- CreateIndex
CREATE INDEX "Cart_user_id_status_idx" ON "Cart"("user_id", "status");

-- CreateIndex
CREATE INDEX "Cart_status_last_activity_at_idx" ON "Cart"("status", "last_activity_at");

-- CreateIndex
CREATE INDEX "Cart_session_id_idx" ON "Cart"("session_id");

-- CreateIndex
CREATE INDEX "CartItem_cart_id_idx" ON "CartItem"("cart_id");

-- CreateIndex
CREATE INDEX "CartItem_variant_id_idx" ON "CartItem"("variant_id");

-- CreateIndex
CREATE INDEX "CartItem_bundle_id_idx" ON "CartItem"("bundle_id");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
