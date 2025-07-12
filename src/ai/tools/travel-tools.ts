
'use server';

import { ai } from '@/ai/genkit';
import * as z from 'zod';

// Tool to find flights
export const findFlights = ai.defineTool(
  {
    name: 'findFlights',
    description: 'Finds available flights based on destination and budget. This is a simulation and returns mock data.',
    inputSchema: z.object({
      destination: z.string().describe('The destination city, e.g., "Paris".'),
      maxPrice: z.number().optional().describe('The maximum budget for a round-trip ticket.'),
    }),
    outputSchema: z.array(z.object({
        airline: z.string(),
        flightNumber: z.string(),
        price: z.number(),
        departureTime: z.string(),
        arrivalTime: z.string(),
    })),
  },
  async (input) => {
    console.log(`Simulating flight search for: ${input.destination}`);
    // In a real app, you would integrate with a flight search API like Skyscanner or Amadeus.
    // We return realistic mock data for this simulation.
    const mockFlights = [
      { airline: 'Air France', flightNumber: 'AF123', price: 650, departureTime: '2024-09-10T08:00:00Z', arrivalTime: '2024-09-10T22:00:00Z' },
      { airline: 'Lufthansa', flightNumber: 'LH456', price: 720, departureTime: '2024-09-10T10:30:00Z', arrivalTime: '2024-09-11T01:00:00Z' },
      { airline: 'Delta', flightNumber: 'DL789', price: 680, departureTime: '2024-09-10T09:15:00Z', arrivalTime: '2024-09-10T23:30:00Z' },
    ];
    if (input.maxPrice) {
        return mockFlights.filter(f => f.price <= input.maxPrice!);
    }
    return mockFlights;
  }
);

// Tool to find hotels
export const findHotels = ai.defineTool(
  {
    name: 'findHotels',
    description: 'Finds available hotels in a city based on criteria. This is a simulation and returns mock data.',
    inputSchema: z.object({
      city: z.string().describe('The city to search for hotels in, e.g., "Paris".'),
      maxPricePerNight: z.number().optional().describe('The maximum budget per night.'),
      minRating: z.number().optional().describe('The minimum star rating for the hotel (1-5).'),
    }),
    outputSchema: z.array(z.object({
        name: z.string(),
        rating: z.number(),
        pricePerNight: z.number(),
        amenities: z.array(z.string()),
    })),
  },
  async (input) => {
    console.log(`Simulating hotel search for: ${input.city}`);
    // In a real app, you would integrate with a hotel booking API like Booking.com or Expedia.
    const mockHotels = [
       { name: 'Hotel de Louvre', rating: 5, pricePerNight: 450, amenities: ['Free WiFi', 'Pool', 'Gym'] },
       { name: 'Le Marais Boutique Hotel', rating: 4, pricePerNight: 250, amenities: ['Free WiFi', 'Breakfast Included'] },
       { name: 'Eiffel Tower View Inn', rating: 3, pricePerNight: 150, amenities: ['Free WiFi'] },
       { name: 'Montmartre Budget Stay', rating: 2, pricePerNight: 90, amenities: ['Shared Bathroom'] },
    ];
    let filteredHotels = mockHotels;
    if (input.maxPricePerNight) {
        filteredHotels = filteredHotels.filter(h => h.pricePerNight <= input.maxPricePerNight!);
    }
    if (input.minRating) {
         filteredHotels = filteredHotels.filter(h => h.rating >= input.minRating!);
    }
    return filteredHotels;
  }
);
