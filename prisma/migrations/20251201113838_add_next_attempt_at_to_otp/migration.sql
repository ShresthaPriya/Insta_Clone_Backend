/*
  Warnings:

  - You are about to drop the column `expiredAt` on the `Otp` table. All the data in the column will be lost.
  - Added the required column `nextAttemptAt` to the `Otp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Otp" DROP COLUMN "expiredAt",
ADD COLUMN     "nextAttemptAt" TIMESTAMP(3) NOT NULL;
