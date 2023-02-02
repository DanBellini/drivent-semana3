import faker from "@faker-js/faker";
import { prisma } from "@/config";

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

export async function createHotels() {
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