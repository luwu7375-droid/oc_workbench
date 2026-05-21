-- OC Workbench — 初始化数据库
-- 在 Supabase Dashboard > SQL Editor 里粘贴执行

-- 1. 创建枚举类型
CREATE TYPE "ItemType" AS ENUM ('profile', 'snippet', 'reference', 'image', 'state_card');

-- 2. 角色表
CREATE TABLE "Character" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "note" TEXT,
  "avatar" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- 3. 内容项表
CREATE TABLE "Item" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "content" TEXT NOT NULL,
  "title" TEXT,
  "itemType" "ItemType" NOT NULL DEFAULT 'reference',
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "image" TEXT,
  "fictionalOrder" INTEGER,
  "fictionalStage" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- 4. 角色-内容关联表
CREATE TABLE "ItemCharacter" (
  "itemId" TEXT NOT NULL,
  "characterId" TEXT NOT NULL,
  CONSTRAINT "ItemCharacter_pkey" PRIMARY KEY ("itemId", "characterId"),
  CONSTRAINT "ItemCharacter_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ItemCharacter_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
