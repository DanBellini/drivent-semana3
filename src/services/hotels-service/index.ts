import { notFoundError, paymentRequiredError } from "@/errors";
import enrollmentRepository from "@/repositories/enrollment-repository";
import hotelRepositories from "@/repositories/hotel-repository";
import ticketRepository from "@/repositories/ticket-repository";

async function verifyEnrollmentAndTicketType(userId: number) {

    const userEnrollment = await enrollmentRepository.findWithAddressByUserId(userId);

    if (!userEnrollment) {
        throw notFoundError();
    };

    const userTicket = await ticketRepository.findTicketByEnrollmentId(userEnrollment.id);

    if (!userTicket) {
        throw notFoundError();
    };

    if (userTicket.status !== "PAID") {
        throw paymentRequiredError();
    };

    if (userTicket.TicketType.isRemote === true) {
        throw paymentRequiredError();
    };

    if (userTicket.TicketType.includesHotel === false) {
        throw paymentRequiredError();
    };
}

async function getAllHotels(userId: number) {
    await verifyEnrollmentAndTicketType(userId);

    const hotels = await hotelRepositories.findManyHotels();

    if (!hotels) {
        throw notFoundError();
    };

    return hotels;
}

async function getHotelByHotelId(userId: number, hotelId: number) {
    await verifyEnrollmentAndTicketType(userId);

    const hotel = await hotelRepositories.findHotelByHotelId(hotelId);

    if (!hotel) {
        throw notFoundError();
    };

    return hotel;
}

const hotelService = {
    getAllHotels,
    getHotelByHotelId
};

export default hotelService;