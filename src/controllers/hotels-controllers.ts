import { AuthenticatedRequest } from "@/middlewares";
import hotelService from "@/services/hotels-service";
import { Response } from "express";
import httpStatus from "http-status";

export async function getAllHotels(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;

    try {
        const hotels = await hotelService.getAllHotels(userId);

        return res.status(httpStatus.OK).send(hotels);
    } catch (error) {
        if (error.name === "NotFoundError") {
            return res.sendStatus(httpStatus.NOT_FOUND);
        };
        if (error.name === "PaymentRequiredError") {
            return res.sendStatus(httpStatus.PAYMENT_REQUIRED);
        };
        return res.sendStatus(httpStatus.BAD_REQUEST);
    };
};

export async function getHotelByHotelId(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    const hotelId = Number(req.params.hotelId);

    if (!hotelId) {
        return res.sendStatus(httpStatus.BAD_REQUEST);
    };

    try {
        const hotel = await hotelService.getHotelByHotelId(userId, hotelId);

        return res.status(httpStatus.OK).send(hotel);
    } catch (error) {
        if (error.name === "NotFoundError") {
            return res.sendStatus(httpStatus.NOT_FOUND);
        };
        if (error.name === "PaymentRequiredError") {
            return res.sendStatus(httpStatus.PAYMENT_REQUIRED);
        };
        return res.sendStatus(httpStatus.BAD_REQUEST);
    };
};