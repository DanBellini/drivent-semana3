import app, { init } from "@/app";
import faker from "@faker-js/faker";
import httpStatus from "http-status";
import supertest from "supertest";
import { cleanDb, generateValidToken } from "../helpers";
import * as jwt from "jsonwebtoken";
import { createEnrollmentWithAddress, createUser, createTicketType, createTicket } from "../factories";
import { TicketStatus } from "@prisma/client";
import { createHotels, createTicketTypeChoiceIsRemoteAndIncludesHotel } from "../factories/hotels-factory";

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
                const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

                const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

                expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
            });

            it("should respond with status 402 and with ticketType is PAID > isRemote is true and includesHotel is true", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const isRemote = true
                const includesHotel = true
                const ticketType = await createTicketTypeChoiceIsRemoteAndIncludesHotel(isRemote, includesHotel);
                await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

                const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

                expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
            });

            it("should respond with status 402 and with ticketType is PAID > isRemote is false and includesHotel is false", async () => {
                const user = await createUser();
                const token = await generateValidToken(user);
                const enrollment = await createEnrollmentWithAddress(user);
                const isRemote = false
                const includesHotel = false
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
                    const isRemote = false
                    const includesHotel = true
                    const ticketType = await createTicketTypeChoiceIsRemoteAndIncludesHotel(isRemote, includesHotel);
                    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

                    const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);

                    expect(response.status).toEqual(httpStatus.NOT_FOUND);
                    expect(response.body).toEqual([]);
                })

                it("should respond with status 200 and with existing hotels data",async () => {
                    const user = await createUser();
                    const token = await generateValidToken(user);
                    const enrollment = await createEnrollmentWithAddress(user);
                    const isRemote = false
                    const includesHotel = true
                    const ticketType = await createTicketTypeChoiceIsRemoteAndIncludesHotel(isRemote, includesHotel);
                    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
                    await createHotels();

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
                    )
                })
            })
        });
    });
});