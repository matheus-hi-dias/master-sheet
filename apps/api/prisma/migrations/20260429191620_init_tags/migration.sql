-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SheetToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_TagToTemplate" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_SheetToTag_AB_unique" ON "_SheetToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_SheetToTag_B_index" ON "_SheetToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TagToTemplate_AB_unique" ON "_TagToTemplate"("A", "B");

-- CreateIndex
CREATE INDEX "_TagToTemplate_B_index" ON "_TagToTemplate"("B");

-- AddForeignKey
ALTER TABLE "_SheetToTag" ADD CONSTRAINT "_SheetToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Sheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SheetToTag" ADD CONSTRAINT "_SheetToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToTemplate" ADD CONSTRAINT "_TagToTemplate_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToTemplate" ADD CONSTRAINT "_TagToTemplate_B_fkey" FOREIGN KEY ("B") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;