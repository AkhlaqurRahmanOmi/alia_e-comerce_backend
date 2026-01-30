-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending_payment', 'pending', 'confirmed', 'cancelled', 'completed', 'no_show');

-- CreateEnum
CREATE TYPE "BookingPaymentStatus" AS ENUM ('not_required', 'pending', 'completed', 'refunded', 'failed');

-- CreateTable
CREATE TABLE "BookingSetting" (
    "id" SERIAL NOT NULL,
    "max_capacity_per_slot" INTEGER NOT NULL,
    "slot_duration_minutes" INTEGER NOT NULL,
    "opening_time" VARCHAR(5) NOT NULL,
    "closing_time" VARCHAR(5) NOT NULL,
    "advance_booking_days" INTEGER NOT NULL,
    "min_party_size" INTEGER NOT NULL DEFAULT 1,
    "max_party_size" INTEGER NOT NULL DEFAULT 20,
    "require_deposit" BOOLEAN NOT NULL DEFAULT false,
    "deposit_amount" DOUBLE PRECISION,
    "deposit_type" VARCHAR(20) DEFAULT 'fixed',
    "payment_hold_minutes" INTEGER NOT NULL DEFAULT 15,
    "cancellation_hours" INTEGER NOT NULL DEFAULT 24,
    "is_booking_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "customer_name" VARCHAR(100) NOT NULL,
    "customer_email" VARCHAR(255) NOT NULL,
    "customer_phone" VARCHAR(20) NOT NULL,
    "bookingDate" DATE NOT NULL,
    "booking_time" VARCHAR(5) NOT NULL,
    "party_size" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "special_requests" TEXT,
    "payment_status" "BookingPaymentStatus" NOT NULL DEFAULT 'not_required',
    "deposit_required" BOOLEAN NOT NULL DEFAULT false,
    "deposit_amount" DOUBLE PRECISION,
    "payment_intent_id" VARCHAR(255),
    "paid_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "confirmation_code" VARCHAR(20) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "reminder_sent_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancelled_by" VARCHAR(50),
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPayment" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "payment_gateway" VARCHAR(50) NOT NULL,
    "transaction_id" VARCHAR(255) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedDate" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "is_all_day" BOOLEAN NOT NULL DEFAULT true,
    "start_time" VARCHAR(5),
    "end_time" VARCHAR(5),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomSchedule" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "opening_time" VARCHAR(5) NOT NULL,
    "closing_time" VARCHAR(5) NOT NULL,
    "max_capacity" INTEGER,
    "slot_duration" INTEGER,
    "require_deposit" BOOLEAN,
    "deposit_amount" DOUBLE PRECISION,
    "reason" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingStatusHistory" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL,
    "note" TEXT,
    "changed_by" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_payment_intent_id_key" ON "Booking"("payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_confirmation_code_key" ON "Booking"("confirmation_code");

-- CreateIndex
CREATE INDEX "Booking_bookingDate_booking_time_status_idx" ON "Booking"("bookingDate", "booking_time", "status");

-- CreateIndex
CREATE INDEX "Booking_user_id_idx" ON "Booking"("user_id");

-- CreateIndex
CREATE INDEX "Booking_customer_email_idx" ON "Booking"("customer_email");

-- CreateIndex
CREATE INDEX "Booking_confirmation_code_idx" ON "Booking"("confirmation_code");

-- CreateIndex
CREATE INDEX "Booking_status_bookingDate_idx" ON "Booking"("status", "bookingDate");

-- CreateIndex
CREATE INDEX "Booking_payment_status_idx" ON "Booking"("payment_status");

-- CreateIndex
CREATE INDEX "Booking_expires_at_idx" ON "Booking"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "BookingPayment_transaction_id_key" ON "BookingPayment"("transaction_id");

-- CreateIndex
CREATE INDEX "BookingPayment_booking_id_idx" ON "BookingPayment"("booking_id");

-- CreateIndex
CREATE INDEX "BookingPayment_transaction_id_idx" ON "BookingPayment"("transaction_id");

-- CreateIndex
CREATE INDEX "BlockedDate_date_idx" ON "BlockedDate"("date");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedDate_date_key" ON "BlockedDate"("date");

-- CreateIndex
CREATE INDEX "CustomSchedule_date_idx" ON "CustomSchedule"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CustomSchedule_date_key" ON "CustomSchedule"("date");

-- CreateIndex
CREATE INDEX "BookingStatusHistory_booking_id_idx" ON "BookingStatusHistory"("booking_id");

-- CreateIndex
CREATE INDEX "BookingStatusHistory_booking_id_created_at_idx" ON "BookingStatusHistory"("booking_id", "created_at");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPayment" ADD CONSTRAINT "BookingPayment_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStatusHistory" ADD CONSTRAINT "BookingStatusHistory_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
