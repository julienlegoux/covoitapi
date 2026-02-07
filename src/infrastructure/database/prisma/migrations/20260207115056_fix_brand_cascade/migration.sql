-- DropForeignKey
ALTER TABLE "cars" DROP CONSTRAINT "cars_model_id_fkey";

-- DropForeignKey
ALTER TABLE "models" DROP CONSTRAINT "models_brand_id_fkey";

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "models" ADD CONSTRAINT "models_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
