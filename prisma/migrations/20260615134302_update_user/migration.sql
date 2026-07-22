/*
  Warnings:

  - You are about to drop the column `birthday` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `totalBuy` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[personCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `personCode` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "birthday",
DROP COLUMN "totalBuy",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "personCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_personCode_key" ON "User"("personCode");
