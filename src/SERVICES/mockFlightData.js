
// services/mockFlightData.js

/**
 * Mock Flight Data for Development
 * This will be replaced with real Amadeus API calls
 */

// ============================================
// MOCK FLIGHT OFFERS
// ============================================

export const mockFlightOffers = [
  // Lagos to London - Direct Flight
  {
    type: 'flight-offer',
    id: '1',
    source: 'GDS',
    instantTicketingRequired: false,
    nonHomogeneous: false,
    oneWay: false,
    lastTicketingDate: '2024-12-20',
    numberOfBookableSeats: 9,
    
    itineraries: [
      {
        duration: 'PT6H45M',
        segments: [
          {
            departure: {
              iataCode: 'LOS',
              terminal: 'I',
              at: '2024-12-25T23:30:00',
            },
            arrival: {
              iataCode: 'LHR',
              terminal: '3',
              at: '2024-12-26T06:15:00',
            },
            carrierCode: 'BA',
            number: '75',
            aircraft: {
              code: '789',
            },
            operating: {
              carrierCode: 'BA',
            },
            duration: 'PT6H45M',
            id: '1',
            numberOfStops: 0,
            blacklistedInEU: false,
          },
        ],
      },
    ],
    
    price: {
      currency: 'NGN',
      total: '450000',
      base: '380000',
      fees: [
        {
          amount: '35000',
          type: 'SUPPLIER',
        },
        {
          amount: '35000',
          type: 'TICKETING',
        },
      ],
      grandTotal: '450000',
    },
    
    pricingOptions: {
      fareType: ['PUBLISHED'],
      includedCheckedBagsOnly: true,
    },
    
    validatingAirlineCodes: ['BA'],
    
    travelerPricings: [
      {
        travelerId: '1',
        fareOption: 'STANDARD',
        travelerType: 'ADULT',
        price: {
          currency: 'NGN',
          total: '450000',
          base: '380000',
        },
        fareDetailsBySegment: [
          {
            segmentId: '1',
            cabin: 'ECONOMY',
            fareBasis: 'TOWNG',
            class: 'T',
            includedCheckedBags: {
              weight: 23,
              weightUnit: 'KG',
            },
          },
        ],
      },
    ],
  },

  // Lagos to London - 1 Stop (Cheaper)
  {
    type: 'flight-offer',
    id: '2',
    source: 'GDS',
    instantTicketingRequired: false,
    nonHomogeneous: false,
    oneWay: false,
    lastTicketingDate: '2024-12-20',
    numberOfBookableSeats: 7,
    
    itineraries: [
      {
        duration: 'PT10H30M',
        segments: [
          {
            departure: {
              iataCode: 'LOS',
              terminal: 'I',
              at: '2024-12-25T14:20:00',
            },
            arrival: {
              iataCode: 'IST',
              terminal: 'I',
              at: '2024-12-25T21:15:00',
            },
            carrierCode: 'TK',
            number: '620',
            aircraft: {
              code: '77W',
            },
            operating: {
              carrierCode: 'TK',
            },
            duration: 'PT6H55M',
            id: '2',
            numberOfStops: 0,
            blacklistedInEU: false,
          },
          {
            departure: {
              iataCode: 'IST',
              terminal: 'I',
              at: '2024-12-25T23:45:00',
            },
            arrival: {
              iataCode: 'LHR',
              terminal: '2',
              at: '2024-12-26T01:50:00',
            },
            carrierCode: 'TK',
            number: '1979',
            aircraft: {
              code: '321',
            },
            operating: {
              carrierCode: 'TK',
            },
            duration: 'PT4H05M',
            id: '3',
            numberOfStops: 0,
            blacklistedInEU: false,
          },
        ],
      },
    ],
    
    price: {
      currency: 'NGN',
      total: '380000',
      base: '320000',
      fees: [
        {
          amount: '30000',
          type: 'SUPPLIER',
        },
        {
          amount: '30000',
          type: 'TICKETING',
        },
      ],
      grandTotal: '380000',
    },
    
    pricingOptions: {
      fareType: ['PUBLISHED'],
      includedCheckedBagsOnly: true,
    },
    
    validatingAirlineCodes: ['TK'],
    
    travelerPricings: [
      {
        travelerId: '1',
        fareOption: 'STANDARD',
        travelerType: 'ADULT',
        price: {
          currency: 'NGN',
          total: '380000',
          base: '320000',
        },
        fareDetailsBySegment: [
          {
            segmentId: '2',
            cabin: 'ECONOMY',
            fareBasis: 'VLOWNG',
            class: 'V',
            includedCheckedBags: {
              weight: 30,
              weightUnit: 'KG',
            },
          },
          {
            segmentId: '3',
            cabin: 'ECONOMY',
            fareBasis: 'VLOWNG',
            class: 'V',
            includedCheckedBags: {
              weight: 30,
              weightUnit: 'KG',
            },
          },
        ],
      },
    ],
  },

  // Lagos to Dubai - Direct
  {
    type: 'flight-offer',
    id: '3',
    source: 'GDS',
    instantTicketingRequired: false,
    nonHomogeneous: false,
    oneWay: false,
    lastTicketingDate: '2024-12-20',
    numberOfBookableSeats: 5,
    
    itineraries: [
      {
        duration: 'PT8H30M',
        segments: [
          {
            departure: {
              iataCode: 'LOS',
              terminal: 'I',
              at: '2024-12-25T22:45:00',
            },
            arrival: {
              iataCode: 'DXB',
              terminal: '3',
              at: '2024-12-26T07:15:00',
            },
            carrierCode: 'EK',
            number: '783',
            aircraft: {
              code: '77W',
            },
            operating: {
              carrierCode: 'EK',
            },
            duration: 'PT8H30M',
            id: '4',
            numberOfStops: 0,
            blacklistedInEU: false,
          },
        ],
      },
    ],
    
    price: {
      currency: 'NGN',
      total: '520000',
      base: '450000',
      fees: [
        {
          amount: '35000',
          type: 'SUPPLIER',
        },
        {
          amount: '35000',
          type: 'TICKETING',
        },
      ],
      grandTotal: '520000',
    },
    
    pricingOptions: {
      fareType: ['PUBLISHED'],
      includedCheckedBagsOnly: true,
    },
    
    validatingAirlineCodes: ['EK'],
    
    travelerPricings: [
      {
        travelerId: '1',
        fareOption: 'STANDARD',
        travelerType: 'ADULT',
        price: {
          currency: 'NGN',
          total: '520000',
          base: '450000',
        },
        fareDetailsBySegment: [
          {
            segmentId: '4',
            cabin: 'ECONOMY',
            fareBasis: 'OOWNG',
            class: 'O',
            includedCheckedBags: {
              weight: 30,
              weightUnit: 'KG',
            },
          },
        ],
      },
    ],
  },
];

// ============================================
// AIRLINE INFORMATION
// ============================================

export const airlines = {
  BA: {
    code: 'BA',
    name: 'British Airways',
    logo: 'https://images.kiwi.com/airlines/64/BA.png',
  },
  TK: {
    code: 'TK',
    name: 'Turkish Airlines',
    logo: 'https://images.kiwi.com/airlines/64/TK.png',
  },
  EK: {
    code: 'EK',
    name: 'Emirates',
    logo: 'https://images.kiwi.com/airlines/64/EK.png',
  },
  LH: {
    code: 'LH',
    name: 'Lufthansa',
    logo: 'https://images.kiwi.com/airlines/64/LH.png',
  },
  AF: {
    code: 'AF',
    name: 'Air France',
    logo: 'https://images.kiwi.com/airlines/64/AF.png',
  },
  KL: {
    code: 'KL',
    name: 'KLM',
    logo: 'https://images.kiwi.com/airlines/64/KL.png',
  },
};

// ============================================
// POPULAR ROUTES FROM NIGERIA
// ============================================

export const popularRoutes = [
  {
    id: '1',
    origin: 'LOS',
    destination: 'LHR',
    originName: 'Lagos',
    destinationName: 'London',
    price: 450000,
    currency: 'NGN',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400',
  },
  {
    id: '2',
    origin: 'LOS',
    destination: 'DXB',
    originName: 'Lagos',
    destinationName: 'Dubai',
    price: 520000,
    currency: 'NGN',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400',
  },
  {
    id: '3',
    origin: 'ABV',
    destination: 'LHR',
    originName: 'Abuja',
    destinationName: 'London',
    price: 470000,
    currency: 'NGN',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400',
  },
  {
    id: '4',
    origin: 'LOS',
    destination: 'JFK',
    originName: 'Lagos',
    destinationName: 'New York',
    price: 680000,
    currency: 'NGN',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400',
  },
];

// ============================================
// MOCK SERVICE FUNCTIONS
// ============================================

/**
 * Mock flight search
 */
export const mockSearchFlights = async (params) => {
  const { originLocationCode, destinationLocationCode, departureDate, adults = 1 } = params;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Filter flights based on origin/destination
  let results = mockFlightOffers.filter(offer => {
    const firstSegment = offer.itineraries[0].segments[0];
    const lastSegment = offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1];
    
    return (
      firstSegment.departure.iataCode === originLocationCode &&
      lastSegment.arrival.iataCode === destinationLocationCode
    );
  });

  // Adjust prices for number of passengers
  results = results.map(offer => ({
    ...offer,
    price: {
      ...offer.price,
      total: (parseInt(offer.price.total) * adults).toString(),
      grandTotal: (parseInt(offer.price.grandTotal) * adults).toString(),
    },
    travelerPricings: Array.from({ length: adults }, (_, i) => ({
      ...offer.travelerPricings[0],
      travelerId: (i + 1).toString(),
    })),
  }));

  return {
    success: true,
    data: results,
    meta: {
      count: results.length,
    },
    dictionaries: {
      locations: {
        LOS: { cityCode: 'LOS', countryCode: 'NG' },
        LHR: { cityCode: 'LON', countryCode: 'GB' },
        IST: { cityCode: 'IST', countryCode: 'TR' },
        DXB: { cityCode: 'DXB', countryCode: 'AE' },
      },
      carriers: airlines,
    },
  };
};

/**
 * Mock price confirmation
 */
export const mockConfirmPrice = async (flightOffer) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    success: true,
    data: {
      type: 'flight-offers-pricing',
      flightOffers: [flightOffer],
    },
  };
};

/**
 * Mock popular routes
 */
export const mockGetPopularRoutes = async (origin) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    success: true,
    data: popularRoutes.filter(route => route.origin === origin),
  };
};

export default {
  mockSearchFlights,
  mockConfirmPrice,
  mockGetPopularRoutes,
  mockFlightOffers,
  airlines,
  popularRoutes,
};