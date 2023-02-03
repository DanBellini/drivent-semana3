import faker from "@faker-js/faker";
import { prisma } from "@/config";
import { Hotel } from "@prisma/client";

export async function createTicketTypeChoiceIsRemoteAndIncludesHotel(isRemote: boolean, includesHotel: boolean) {
    return prisma.ticketType.create({
        data: {
            name: faker.name.findName(),
            price: faker.datatype.number(),
            isRemote,
            includesHotel,
        },
    });
}

export async function createManyHotels() {
    return prisma.hotel.createMany({
        data: [{
            name: "ZAGAIA ECO RESORT",
            image: "https://eliteresorts.com.br/blog/wp-content/uploads/2022/08/BR-Zagaia-Eco-Resort-Piscina-001-2.jpg"
        },
        {
            name: "POUSADA ARTE DA NATUREZA",
            image: "https://eliteresorts.com.br/blog/wp-content/uploads/2022/08/BR-Pousada-Arte-da-Natureza-Piscina-002.jpg"
        },
        {
            name: "HOTEL SANTA ESMERALDA",
            image: "https://eliteresorts.com.br/blog/wp-content/uploads/2022/08/BR-Hotel-Santa-Esmeralda-Panorâmica-001.jpg"
        }
        ]
    });
};

export async function createHotel() {
    return prisma.hotel.create({
        data: {
            name: "ZAGAIA ECO RESORT",
            image: "https://eliteresorts.com.br/blog/wp-content/uploads/2022/08/BR-Zagaia-Eco-Resort-Piscina-001-2.jpg"
        }
    })
}

export async function generateHotelId(hotelId: number, isValid: boolean) {
    let hotel: Hotel = {
        id: 0,
        name: "",
        image: "",
        createdAt: undefined,
        updatedAt: undefined
    }

    if (isValid) {
        hotel = await prisma.hotel.findFirst({
            where: {
                id: hotelId
            }
        })
        return hotel.id
    } else {
        hotel = await prisma.hotel.findFirst({})
        return hotel.id - 1
    }
}

export function createManyRooms(hotelId: number) {
    return prisma.room.createMany({
        data: [{
            name: "Casal",
            capacity: 2,
            hotelId: hotelId
        }, {
            name: "Compartilhado",
            capacity: 3,
            hotelId: hotelId
        }, {
            name: "Solteiro",
            capacity: 1,
            hotelId: hotelId
        }]
    })
}

export async function findRoomsByHotelId(hotelId:number) {
    return prisma.room.findMany({
        where:{
            hotelId
        }
    })
}
