import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { getAllHotels, getHotelByHotelId } from "@/controllers/hotels-controllers";

const hotelsRouter = Router();

hotelsRouter
    .all("/*", authenticateToken)
    .get("", getAllHotels)
    .get("/:hotelId", getHotelByHotelId);

export { hotelsRouter };