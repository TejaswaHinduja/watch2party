/*
  Warnings:

  - The values [USER,ADMIN] on the enum `role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Todo` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `joinedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `socketId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "role_new" AS ENUM ('PARTICIPANT', 'HOST');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "role_new" USING ("role"::text::"role_new");
ALTER TYPE "role" RENAME TO "role_old";
ALTER TYPE "role_new" RENAME TO "role";
DROP TYPE "public"."role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Todo" DROP CONSTRAINT "Todo_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "roomId" TEXT NOT NULL,
ADD COLUMN     "socketId" TEXT NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'PARTICIPANT';

-- DropTable
DROP TABLE "Todo";

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "currentTime" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Room_userId_key" ON "Room"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
