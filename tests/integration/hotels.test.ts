import app, { init } from "@/app";
import faker from "@faker-js/faker";
import httpStatus from "http-status";
import supertest from "supertest";
import { cleanDb, generateValidToken } from "../helpers";
import * as jwt from "jsonwebtoken";
import { createEnrollmentWithAddress, createUser, createTicketType, createTicket } from "../factories";
import { TicketStatus } from "@prisma/client";
import { createHotel, createManyHotels, createManyRooms, createTicketTypeChoiceIsRemoteAndIncludesHotel, findRoomsByHotelId, generateHotelId } from "../factories/hotels-factory";

beforeAll(async () => {
    await init();
});

beforeEach(async () => {
    await cleanDb();
});

const server = supertest(app);

describe("GET /hotels", () => {
    it("should respond with status 401 if no token is given", async () => {
        const response = await server.get("/hotels");

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();

        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("when token is valid", () => {

        it("should respond with status 404 when there is no enrollment created", async () => {
            const token = await generateValidToken();

            const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });

        it("should respond with status 404 when user doesnt have a ticket yet", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            await createEnrollmentWithAddress(user);

            const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });

        describe("when exist enrollment and exist ticket", () => {

            it("should respond status 402 when ticketType is not paid", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketType();
                await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

                const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

                expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
            });

            it("should respond with status 402 and with ticketType is PAID > isRemote is true and includesHotel is true", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const isRemote = true;
                const includesHotel = true;
                const ticketType = await createTicketTypeChoiceIsRemoteAndIncludesHotel(isRemote, includesHotel);
                await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

                const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

                expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
            });

            it("should respond with status 402 and with ticketType is PAID > isRemote is false and includesHotel is false", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const isRemote = false;
                const includesHotel = false;
                const ticketType = await createTicketTypeChoiceIsRemoteAndIncludesHotel(isRemote, includesHotel);
                await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

                const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

                expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
            });

            describe("when ticketType is valid", () => {
                it("should respond with empty array when there are no hotels created", async () => {
                    const user = await createUser();
                    const token = await generateValidToken(user);
                    const enrollment = await createEnrollmentWithAddress(user);
                    const isRemote = false;
                    const includesHotel = true;
                    const ticketType = await createTicketTypeChoiceIsRemoteAndIncludesHotel(isRemote, includesHotel);
                    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

                    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

                    expect(response.status).toEqual(httpStatus.NOT_FOUND);
                    expect(response.body).toEqual([]);
                })

                it("should respond with status 200 and with existing hotels data", async () => {
                    const user = await createUser();
                    const token = await generateValidToken(user);
                    const enrollment = await createEnrollmentWithAddress(user);
                    const isRemote = false;
                    const includesHotel = true;
                    const ticketType = await createTicketTypeChoiceIsRemoteAndIncludesHotel(isRemote, includesHotel);
                    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                    await createManyHotels();

                    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

                    expect(response.status).toEqual(httpStatus.OK);
                    expect(response.body).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({
                                id: expect.any(Number),
                                name: expect.any(String),
                                image: expect.any(String)
                            })
                        ])
                    );
                });
            });
        });
    });
});

describe("GET /hotels/:hotelId", () => {
    it("should respond with status 401 if no token is given", async () => {
        const response = await server.get("/hotels/");

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if given token is not valid", async () => {
        const token = faker.lorem.word();

        const response = await server.get("/hotels/").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it("should respond with status 401 if there is no session for given token", async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.get("/hotels/").set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe("when token is valid", () => {

        it("should respond with status 400 when there is no hotelId params passed", async () => {
            const token = await generateValidToken();
            const hotelId: any = undefined;

            const response = await server.get(`/hotels/${hotelId}`).set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.BAD_REQUEST);
        });

        it("should respond with status 404 when there is no enrollment created", async () => {
            const token = await generateValidToken();
            const hotel = await createHotel();
            const isValid = true;
            const hotelId = await generateHotelId(hotel.id, isValid);

            const response = await server.get(`/hotels/${hotelId}`).set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });

        it("should respond with status 404 when user doesnt have a ticket yet", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            await createEnrollmentWithAddress(user);
            const hotel = await createHotel();
            const isValid = true;
            const hotelId = await generateHotelId(hotel.id, isValid);

            const response = await server.get(`/hotels/${hotelId}`).set("Authorization", `Bearer ${token}`);

            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        });

        describe("when exist enrollment and exist ticket", () => {

            it("should respond status 402 when ticketType is not paid", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const ticketType = await createTicketType();
                await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
                const hotel = await createHotel();
                const isValid = true;
                const hotelId = await generateHotelId(hotel.id, isValid);

                const response = await server.get(`/hotels/${hotelId}`).set("Authorization", `Bearer ${token}`);

                expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
            });

            it("should respond with status 402 and with ticketType is PAID > isRemote is true and includesHotel is true", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const isRemote = true;
                const includesHotel = true;
                const ticketType = await createTicketTypeChoiceIsRemoteAndIncludesHotel(isRemote, includesHotel);
                await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                const hotel = await createHotel();
                const isValid = true;
                const hotelId = await generateHotelId(hotel.id, isValid);

                const response = await server.get(`/hotels/${hotelId}`).set("Authorization", `Bearer ${token}`);

                expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
            });

            it("should respond with status 402 and with ticketType is PAID > isRemote is false and includesHotel is false", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const isRemote = false;
                const includesHotel = false;
                const ticketType = await createTicketTypeChoiceIsRemoteAndIncludesHotel(isRemote, includesHotel);
                await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                const hotel = await createHotel();
                const isValid = true;
                const hotelId = await generateHotelId(hotel.id, isValid);

                const response = await server.get(`/hotels/${hotelId}`).set("Authorization", `Bearer ${token}`);

                expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
            });

            describe("when ticketType is valid", () => {
                it("should respond with empty object when there are no hotel created", async () => {
                    const user = await createUser();
                    const token = await generateValidToken(user);
                    const enrollment = await createEnrollmentWithAddress(user);
                    const isRemote = false;
                    const includesHotel = true;
                    const ticketType = await createTicketTypeChoiceIsRemoteAndIncludesHotel(isRemote, includesHotel);
                    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                    const hotel = await createHotel();
                    const isValid = false;
                    const hotelId = await generateHotelId(hotel.id, isValid);

                    const response = await server.get(`/hotels/${hotelId}`).set("Authorization", `Bearer ${token}`);

                    expect(response.status).toEqual(httpStatus.NOT_FOUND);
                    expect(response.body).toEqual({});
                });

                describe("existing hotel data", () => {

                    it("should respond with status 200, but not existing Room data", async () => {
                        const user = await createUser();
                        const token = await generateValidToken(user);
                        const enrollment = await createEnrollmentWithAddress(user);
                        const isRemote = false;
                        const includesHotel = true;
                        const ticketType = await createTicketTypeChoiceIsRemoteAndIncludesHotel(isRemote, includesHotel);
                        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                        const hotel = await createHotel();
                        const isValid = true;
                        const hotelId = await generateHotelId(hotel.id, isValid);

                        const response = await server.get(`/hotels/${hotelId}`).set("Authorization", `Bearer ${token}`);

                        expect(response.status).toEqual(httpStatus.OK);
                        expect(response.body).toEqual({
                            id: hotel.id,
                            name: hotel.name,
                            image: hotel.image,
                            Rooms: [],
                            createdAt: hotel.createdAt.toISOString(),
                            updatedAt: hotel.updatedAt.toISOString()
                        });
                    });

                    it("should respond with status 200 and existing Room data", async () => {
                        const user = await createUser();
                        const token = await generateValidToken(user);
                        const enrollment = await createEnrollmentWithAddress(user);
                        const isRemote = false;
                        const includesHotel = true;
                        const ticketType = await createTicketTypeChoiceIsRemoteAndIncludesHotel(isRemote, includesHotel);
                        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                        const hotel = await createHotel();
                        const isValid = true;
                        const hotelId = await generateHotelId(hotel.id, isValid);
                        await createManyRooms(hotelId);
                        const room = await findRoomsByHotelId(hotelId);

                        const response = await server.get(`/hotels/${hotelId}`).set("Authorization", `Bearer ${token}`);

                        expect(response.status).toEqual(httpStatus.OK);
                        expect(response.body).toEqual({
                            id: hotel.id,
                            name: hotel.name,
                            image: hotel.image,
                            Rooms: [{
                                id: room[0].id,
                                name: room[0].name,
                                capacity: room[0].capacity,
                                hotelId: room[0].hotelId,
                                createdAt: room[0].createdAt.toISOString(),
                                updatedAt: room[0].updatedAt.toISOString()
                            }, {
                                id: room[1].id,
                                name: room[1].name,
                                capacity: room[1].capacity,
                                hotelId: room[1].hotelId,
                                createdAt: room[1].createdAt.toISOString(),
                                updatedAt: room[1].updatedAt.toISOString()
                            }, {
                                id: room[2].id,
                                name: room[2].name,
                                capacity: room[2].capacity,
                                hotelId: room[2].hotelId,
                                createdAt: room[2].createdAt.toISOString(),
                                updatedAt: room[2].updatedAt.toISOString()
                            }],
                            createdAt: hotel.createdAt.toISOString(),
                            updatedAt: hotel.updatedAt.toISOString()
                        });
                    });
                });
            });
        });
    });
});