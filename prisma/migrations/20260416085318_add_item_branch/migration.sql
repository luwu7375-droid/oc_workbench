-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "branch" TEXT;

-- CreateTable
CREATE TABLE "CharacterGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "characterIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterGroup_pkey" PRIMARY KEY ("id")
);
