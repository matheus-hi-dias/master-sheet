/*
  `updatedAt` is added with a temporary default so existing rows are backfilled
  before the default is dropped (Prisma's `@updatedAt` is app-side).
*/
-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "forkedFromId" TEXT,
ADD COLUMN     "isOfficial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "system" TEXT NOT NULL DEFAULT 'custom',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Template" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "_SheetToTag" ADD CONSTRAINT "_SheetToTag_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_SheetToTag_AB_unique";

-- AlterTable
ALTER TABLE "_TagToTemplate" ADD CONSTRAINT "_TagToTemplate_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_TagToTemplate_AB_unique";

-- CreateIndex
CREATE INDEX "Template_system_idx" ON "Template"("system");

-- CreateIndex
CREATE INDEX "Template_isPublic_idx" ON "Template"("isPublic");

-- CreateIndex
CREATE INDEX "Template_authorId_idx" ON "Template"("authorId");

-- CreateIndex
CREATE INDEX "Template_forkedFromId_idx" ON "Template"("forkedFromId");

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_forkedFromId_fkey" FOREIGN KEY ("forkedFromId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
