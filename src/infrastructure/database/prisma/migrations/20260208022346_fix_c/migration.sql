/*
  Warnings:

  - Added the required column `type` to the `city_routes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'DRIVER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CityTravelType" AS ENUM ('DEPARTURE', 'ARRIVAL');

-- CreateEnum
CREATE TYPE "InscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'ANONYMIZED');

-- DropForeignKey
ALTER TABLE "cars" DROP CONSTRAINT "cars_model_id_fkey";

-- DropForeignKey
ALTER TABLE "models" DROP CONSTRAINT "models_brand_id_fkey";

-- AlterTable
ALTER TABLE "city_routes" ADD COLUMN     "type" "CityTravelType" NOT NULL;

-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "anonymized_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "inscriptions" ADD COLUMN     "status" "InscriptionStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "anonymized_at" TIMESTAMP(3),
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER',
ALTER COLUMN "first_name" DROP NOT NULL,
ALTER COLUMN "last_name" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "models" ADD CONSTRAINT "models_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
