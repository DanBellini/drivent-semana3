import { prisma } from "@/config";


async function findManyHotels() {
    return prisma.hotel.findMany({});
};

async function findHotelByHotelId(hotelId: number) {
    return prisma.hotel.findUnique({
        where: { id: hotelId },
        include: {
            Rooms: {
                where: {
                    hotelId: hotelId
                }
            }
        }
    });
};

const hotelRepositories = {
    findManyHotels,
    findHotelByHotelId
};

export default hotelRepositories;