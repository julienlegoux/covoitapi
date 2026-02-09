/*
  Warnings:

  - A unique constraint covering the columns `[name,brand_ref_id]` on the table `models` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "models_name_brand_ref_id_key" ON "models"("name", "brand_ref_id");
