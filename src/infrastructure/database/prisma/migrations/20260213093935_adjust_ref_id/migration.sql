/*
  Warnings:

  - Added the required column `driver_ref_id` to the `cars` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cars" ADD COLUMN     "driver_ref_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_driver_ref_id_fkey" FOREIGN KEY ("driver_ref_id") REFERENCES "drivers"("ref_id") ON DELETE CASCADE ON UPDATE CASCADE;
