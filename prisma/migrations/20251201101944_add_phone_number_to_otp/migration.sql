/*
  Warnings:

  - You are about to drop the column `isVarified` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phoneNumber` to the `Otp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Otp" ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ALTER COLUMN "attemptCount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isVarified",
ADD COLUMN     "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
