-- Indexes
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX IF NOT EXISTS "Product_status_createdAt_idx" ON "Product"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Product_isFeatured_idx" ON "Product"("isFeatured");
CREATE INDEX IF NOT EXISTS "Product_isNewArrival_idx" ON "Product"("isNewArrival");
CREATE INDEX IF NOT EXISTS "Product_isBestSeller_idx" ON "Product"("isBestSeller");
CREATE INDEX IF NOT EXISTS "Product_isSale_idx" ON "Product"("isSale");
CREATE INDEX IF NOT EXISTS "Product_gender_idx" ON "Product"("gender");
CREATE INDEX IF NOT EXISTS "Product_brandId_idx" ON "Product"("brandId");
CREATE INDEX IF NOT EXISTS "CartItem_cartId_idx" ON "CartItem"("cartId");
CREATE INDEX IF NOT EXISTS "CartItem_productId_idx" ON "CartItem"("productId");
CREATE INDEX IF NOT EXISTS "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "Payment_reference_idx" ON "Payment"("reference");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "Review_productId_isApproved_idx" ON "Review"("productId", "isApproved");
CREATE INDEX IF NOT EXISTS "Review_userId_idx" ON "Review"("userId");

-- Coupon max per user
ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "maxPerUser" INTEGER DEFAULT 1;

-- Unique one review per user per product (drop if conflicts; ignore errors in some envs)
DO $$ BEGIN
  ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_productId_key" UNIQUE ("userId", "productId");
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN unique_violation THEN NULL;
END $$;

-- Coupon usage tracking
CREATE TABLE IF NOT EXISTS "CouponUsage" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CouponUsage_orderId_key" ON "CouponUsage"("orderId");
CREATE INDEX IF NOT EXISTS "CouponUsage_couponId_userId_idx" ON "CouponUsage"("couponId", "userId");

DO $$ BEGIN
  ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Contact messages
CREATE TABLE IF NOT EXISTS "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");
CREATE INDEX IF NOT EXISTS "ContactMessage_isRead_idx" ON "ContactMessage"("isRead");

-- Store settings
CREATE TABLE IF NOT EXISTS "StoreSetting" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoreSetting_pkey" PRIMARY KEY ("id")
);
