/*
  Warnings:

  - You are about to drop the column `route_ref_id` on the `inscriptions` table. All the data in the column will be lost.
  - You are about to drop the `city_routes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `routes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_ref_id,trip_ref_id]` on the table `inscriptions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `trip_ref_id` to the `inscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CityTripType" AS ENUM ('DEPARTURE', 'ARRIVAL');

-- DropForeignKey
ALTER TABLE "city_routes" DROP CONSTRAINT "city_routes_city_ref_id_fkey";

-- DropForeignKey
ALTER TABLE "city_routes" DROP CONSTRAINT "city_routes_route_ref_id_fkey";

-- DropForeignKey
ALTER TABLE "inscriptions" DROP CONSTRAINT "inscriptions_route_ref_id_fkey";

-- DropForeignKey
ALTER TABLE "routes" DROP CONSTRAINT "routes_car_ref_id_fkey";

-- DropForeignKey
ALTER TABLE "routes" DROP CONSTRAINT "routes_driver_ref_id_fkey";

-- DropIndex
DROP INDEX "inscriptions_user_ref_id_route_ref_id_key";

-- AlterTable
ALTER TABLE "inscriptions" DROP COLUMN "route_ref_id",
ADD COLUMN     "trip_ref_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "city_routes";

-- DropTable
DROP TABLE "routes";

-- DropEnum
DROP TYPE "CityTravelType";

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "ref_id" SERIAL NOT NULL,
    "date_trip" TIMESTAMP(3) NOT NULL,
    "kms" INTEGER NOT NULL,
    "seats" INTEGER NOT NULL,
    "driver_ref_id" INTEGER NOT NULL,
    "car_ref_id" INTEGER NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city_trips" (
    "trip_ref_id" INTEGER NOT NULL,
    "city_ref_id" INTEGER NOT NULL,
    "type" "CityTripType" NOT NULL,

    CONSTRAINT "city_trips_pkey" PRIMARY KEY ("trip_ref_id","city_ref_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trips_ref_id_key" ON "trips"("ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "inscriptions_user_ref_id_trip_ref_id_key" ON "inscriptions"("user_ref_id", "trip_ref_id");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driver_ref_id_fkey" FOREIGN KEY ("driver_ref_id") REFERENCES "drivers"("ref_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_car_ref_id_fkey" FOREIGN KEY ("car_ref_id") REFERENCES "cars"("ref_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_trip_ref_id_fkey" FOREIGN KEY ("trip_ref_id") REFERENCES "trips"("ref_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city_trips" ADD CONSTRAINT "city_trips_trip_ref_id_fkey" FOREIGN KEY ("trip_ref_id") REFERENCES "trips"("ref_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city_trips" ADD CONSTRAINT "city_trips_city_ref_id_fkey" FOREIGN KEY ("city_ref_id") REFERENCES "cities"("ref_id") ON DELETE CASCADE ON UPDATE CASCADE;
