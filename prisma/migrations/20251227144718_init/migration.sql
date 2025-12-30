/*
  Warnings:

  - You are about to drop the column `receiverId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `notifications` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[postId,userId]` on the table `likes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `content` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Made the column `expiredAt` on table `otp` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_senderId_fkey";

-- DropIndex
DROP INDEX "notifications_receiverId_isRead_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "receiverId",
DROP COLUMN "senderId",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "followRequestId" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "otp" ALTER COLUMN "expiredAt" SET NOT NULL,
ALTER COLUMN "expiredAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "comment_likes_commentId_idx" ON "comment_likes"("commentId");

-- CreateIndex
CREATE INDEX "comment_likes_userId_idx" ON "comment_likes"("userId");

-- CreateIndex
CREATE INDEX "comments_postId_idx" ON "comments"("postId");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE INDEX "likes_postId_idx" ON "likes"("postId");

-- CreateIndex
CREATE INDEX "likes_userId_idx" ON "likes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_postId_userId_key" ON "likes"("postId", "userId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "posts_userId_idx" ON "posts"("userId");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_followRequestId_fkey" FOREIGN KEY ("followRequestId") REFERENCES "follow_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
