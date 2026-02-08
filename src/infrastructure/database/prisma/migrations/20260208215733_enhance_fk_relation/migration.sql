/*
  Warnings:

  - You are about to drop the column `model_id` on the `cars` table. All the data in the column will be lost.
  - The primary key for the `city_routes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `city_id` on the `city_routes` table. All the data in the column will be lost.
  - You are about to drop the column `route_id` on the `city_routes` table. All the data in the column will be lost.
  - The primary key for the `color_models` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `color_id` on the `color_models` table. All the data in the column will be lost.
  - You are about to drop the column `model_id` on the `color_models` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `drivers` table. All the data in the column will be lost.
  - You are about to drop the column `route_id` on the `inscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `inscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `brand_id` on the `models` table. All the data in the column will be lost.
  - You are about to drop the column `car_id` on the `routes` table. All the data in the column will be lost.
  - You are about to drop the column `driver_id` on the `routes` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ref_id]` on the table `brands` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ref_id]` on the table `cars` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ref_id]` on the table `cities` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ref_id]` on the table `colors` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ref_id]` on the table `drivers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_ref_id]` on the table `drivers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ref_id]` on the table `inscriptions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_ref_id,route_ref_id]` on the table `inscriptions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ref_id]` on the table `models` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ref_id]` on the table `routes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ref_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[auth_ref_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `model_ref_id` to the `cars` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city_ref_id` to the `city_routes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `route_ref_id` to the `city_routes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `color_ref_id` to the `color_models` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model_ref_id` to the `color_models` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_ref_id` to the `drivers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `route_ref_id` to the `inscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_ref_id` to the `inscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brand_ref_id` to the `models` table without a default value. This is not possible if the table is not empty.
  - Added the required column `car_ref_id` to the `routes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driver_ref_id` to the `routes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `auth_ref_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "cars" DROP CONSTRAINT "cars_model_id_fkey";

-- DropForeignKey
ALTER TABLE "city_routes" DROP CONSTRAINT "city_routes_city_id_fkey";

-- DropForeignKey
ALTER TABLE "city_routes" DROP CONSTRAINT "city_routes_route_id_fkey";

-- DropForeignKey
ALTER TABLE "color_models" DROP CONSTRAINT "color_models_color_id_fkey";

-- DropForeignKey
ALTER TABLE "color_models" DROP CONSTRAINT "color_models_model_id_fkey";

-- DropForeignKey
ALTER TABLE "drivers" DROP CONSTRAINT "drivers_user_id_fkey";

-- DropForeignKey
ALTER TABLE "inscriptions" DROP CONSTRAINT "inscriptions_route_id_fkey";

-- DropForeignKey
ALTER TABLE "inscriptions" DROP CONSTRAINT "inscriptions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "models" DROP CONSTRAINT "models_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "routes" DROP CONSTRAINT "routes_car_id_fkey";

-- DropForeignKey
ALTER TABLE "routes" DROP CONSTRAINT "routes_driver_id_fkey";

-- DropIndex
DROP INDEX "drivers_user_id_key";

-- DropIndex
DROP INDEX "inscriptions_user_id_route_id_key";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "ref_id" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "cars" DROP COLUMN "model_id",
ADD COLUMN     "model_ref_id" INTEGER NOT NULL,
ADD COLUMN     "ref_id" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "cities" ADD COLUMN     "ref_id" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "city_routes" DROP CONSTRAINT "city_routes_pkey",
DROP COLUMN "city_id",
DROP COLUMN "route_id",
ADD COLUMN     "city_ref_id" INTEGER NOT NULL,
ADD COLUMN     "route_ref_id" INTEGER NOT NULL,
ADD CONSTRAINT "city_routes_pkey" PRIMARY KEY ("route_ref_id", "city_ref_id");

-- AlterTable
ALTER TABLE "color_models" DROP CONSTRAINT "color_models_pkey",
DROP COLUMN "color_id",
DROP COLUMN "model_id",
ADD COLUMN     "color_ref_id" INTEGER NOT NULL,
ADD COLUMN     "model_ref_id" INTEGER NOT NULL,
ADD CONSTRAINT "color_models_pkey" PRIMARY KEY ("color_ref_id", "model_ref_id");

-- AlterTable
ALTER TABLE "colors" ADD COLUMN     "ref_id" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "drivers" DROP COLUMN "user_id",
ADD COLUMN     "ref_id" SERIAL NOT NULL,
ADD COLUMN     "user_ref_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "inscriptions" DROP COLUMN "route_id",
DROP COLUMN "user_id",
ADD COLUMN     "ref_id" SERIAL NOT NULL,
ADD COLUMN     "route_ref_id" INTEGER NOT NULL,
ADD COLUMN     "user_ref_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "models" DROP COLUMN "brand_id",
ADD COLUMN     "brand_ref_id" INTEGER NOT NULL,
ADD COLUMN     "ref_id" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "routes" DROP COLUMN "car_id",
DROP COLUMN "driver_id",
ADD COLUMN     "car_ref_id" INTEGER NOT NULL,
ADD COLUMN     "driver_ref_id" INTEGER NOT NULL,
ADD COLUMN     "ref_id" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "email",
DROP COLUMN "password",
DROP COLUMN "role",
ADD COLUMN     "auth_ref_id" INTEGER NOT NULL,
ADD COLUMN     "ref_id" SERIAL NOT NULL;

-- CreateTable
CREATE TABLE "auths" (
    "id" TEXT NOT NULL,
    "ref_id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "anonymized_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auths_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auths_ref_id_key" ON "auths"("ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "auths_email_key" ON "auths"("email");

-- CreateIndex
CREATE UNIQUE INDEX "brands_ref_id_key" ON "brands"("ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "cars_ref_id_key" ON "cars"("ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "cities_ref_id_key" ON "cities"("ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "colors_ref_id_key" ON "colors"("ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_ref_id_key" ON "drivers"("ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_user_ref_id_key" ON "drivers"("user_ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "inscriptions_ref_id_key" ON "inscriptions"("ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "inscriptions_user_ref_id_route_ref_id_key" ON "inscriptions"("user_ref_id", "route_ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "models_ref_id_key" ON "models"("ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "routes_ref_id_key" ON "routes"("ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_ref_id_key" ON "users"("ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_ref_id_key" ON "users"("auth_ref_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_auth_ref_id_fkey" FOREIGN KEY ("auth_ref_id") REFERENCES "auths"("ref_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_ref_id_fkey" FOREIGN KEY ("user_ref_id") REFERENCES "users"("ref_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_driver_ref_id_fkey" FOREIGN KEY ("driver_ref_id") REFERENCES "drivers"("ref_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_car_ref_id_fkey" FOREIGN KEY ("car_ref_id") REFERENCES "cars"("ref_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_user_ref_id_fkey" FOREIGN KEY ("user_ref_id") REFERENCES "users"("ref_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_route_ref_id_fkey" FOREIGN KEY ("route_ref_id") REFERENCES "routes"("ref_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city_routes" ADD CONSTRAINT "city_routes_route_ref_id_fkey" FOREIGN KEY ("route_ref_id") REFERENCES "routes"("ref_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city_routes" ADD CONSTRAINT "city_routes_city_ref_id_fkey" FOREIGN KEY ("city_ref_id") REFERENCES "cities"("ref_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_model_ref_id_fkey" FOREIGN KEY ("model_ref_id") REFERENCES "models"("ref_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "models" ADD CONSTRAINT "models_brand_ref_id_fkey" FOREIGN KEY ("brand_ref_id") REFERENCES "brands"("ref_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "color_models" ADD CONSTRAINT "color_models_color_ref_id_fkey" FOREIGN KEY ("color_ref_id") REFERENCES "colors"("ref_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "color_models" ADD CONSTRAINT "color_models_model_ref_id_fkey" FOREIGN KEY ("model_ref_id") REFERENCES "models"("ref_id") ON DELETE CASCADE ON UPDATE CASCADE;
