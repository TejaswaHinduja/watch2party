/*
  Warnings:

  - You are about to drop the column `state` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARTICIPANT', 'HOST');

-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_userId_fkey";

-- DropIndex
DROP INDEX "Room_userId_key";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "state",
DROP COLUMN "userId",
ADD COLUMN     "playState" TEXT NOT NULL DEFAULT 'paused',
ALTER COLUMN "videoId" DROP NOT NULL,
ALTER COLUMN "currentTime" SET DEFAULT 0,
ALTER COLUMN "expiresAt" DROP NOT NULL;

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "role";

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "socketId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PARTICIPANT',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Participant_roomId_idx" ON "Participant"("roomId");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
