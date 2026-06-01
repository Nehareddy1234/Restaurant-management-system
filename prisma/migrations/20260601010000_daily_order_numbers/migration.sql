ALTER TABLE "Order" ADD COLUMN "orderDate" TEXT;

UPDATE "Order"
SET "orderDate" = to_char("createdAt" AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')
WHERE "orderDate" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "orderDate" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "orderNumber" DROP DEFAULT;

CREATE TABLE "OrderDailySequence" (
    "date" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderDailySequence_pkey" PRIMARY KEY ("date")
);

INSERT INTO "OrderDailySequence" ("date", "lastNumber", "updatedAt")
SELECT "orderDate", MAX("orderNumber"), CURRENT_TIMESTAMP
FROM "Order"
GROUP BY "orderDate"
ON CONFLICT ("date") DO UPDATE SET
  "lastNumber" = GREATEST("OrderDailySequence"."lastNumber", EXCLUDED."lastNumber"),
  "updatedAt" = CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "Order_orderDate_orderNumber_key" ON "Order"("orderDate", "orderNumber");
