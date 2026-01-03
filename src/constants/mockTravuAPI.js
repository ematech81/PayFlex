// services/mockTravuAPI.js
// Mock Travu API for development purposes
// This will be replaced with real API calls once you get the API key

// ============================================
// MOCK DATA
// ============================================

const MOCK_TRIPS = [
  // Chisco Transport - Lagos to Owerri
  {
    provider: {
      name: "Chisco Transport",
      short_name: "CTL",
      logo: "https://travu.africa/providers/ctl.jpg"
    },
    trip_id: 320982,
    trip_no: 8,
    trip_date: "2024-01-15",
    departure_time: "15/01/2024 06:00",
    origin_id: 71,
    destination_id: 81,
    origin_name: "Lagos",
    destination_name: "Owerri",
    narration: "EMPIRE (LAGOS) TO OWERRI(IMO)",
    fare: 18000,
    total_seats: 7,
    available_seats: [1, 2, 3, 4, 5, 6, 7],
    blocked_seats: [],
    special_seats: [],
    special_seats_fare: "",
    order_id: 577,
    departure_terminal: "EMPIRE (LAGOS)",
    destination_terminal: "OWERRI(IMO)",
    vehicle: "1+2, Seater, AC, Non-Video",
    boarding_at: "119",
    departure_address: "3 Agege motor Road",
    destination_address: "24 Egbu Road"
  },
  
  // ABC Transport - Lagos to Mbaise
  {
    provider: {
      name: "ABC Transport",
      short_name: "ABC",
      logo: "https://travu.africa/providers/abc.jpg"
    },
    trip_id: 332649,
    trip_no: 4,
    trip_date: "2024-01-15",
    departure_time: "15/01/2024 06:45",
    origin_id: 24,
    destination_id: 32,
    origin_name: "Lagos",
    destination_name: "Mbaise",
    narration: "LAGOS BOLADE OSHODI TO MBAISE",
    fare: 15000,
    total_seats: 14,
    available_seats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    blocked_seats: [],
    special_seats: [],
    special_seats_fare: "",
    order_id: 253,
    departure_terminal: "LAGOS BOLADE OSHODI",
    destination_terminal: "MBAISE",
    vehicle: "2+2, Sprinter Service, AC, Non-Video",
    boarding_at: "55",
    departure_address: "129 Agege Motor Road",
    destination_address: "Alpha Paradise Hotel By Ahiara Junc."
  },
  
  // Chisco Transport - Lagos (Alaba) to Owerri
  {
    provider: {
      name: "Chisco Transport",
      short_name: "CTL",
      logo: "https://travu.africa/providers/ctl.jpg"
    },
    trip_id: 321280,
    trip_no: 8,
    trip_date: "2024-01-15",
    departure_time: "15/01/2024 07:00",
    origin_id: 63,
    destination_id: 81,
    origin_name: "Lagos",
    destination_name: "Owerri",
    narration: "ALABA (LAGOS) TO OWERRI(IMO)",
    fare: 22000,
    total_seats: 7,
    available_seats: [1, 2, 3, 4, 5, 6, 7],
    blocked_seats: [],
    special_seats: [],
    special_seats_fare: "",
    order_id: 908,
    departure_terminal: "ALABA (LAGOS)",
    destination_terminal: "OWERRI(IMO)",
    vehicle: "1+2, Seater, AC, Non-Video",
    boarding_at: "120",
    departure_address: "26 Ojo-Igbede Road, By Chemist Bus/stop",
    destination_address: "24 Egbu Road"
  },
  
  // GUO Transport - Umuahia to Lagos
  {
    provider: {
      name: "GUO Transport",
      short_name: "GUO",
      logo: "https://travu.africa/providers/guo.jpg"
    },
    trip_id: 96861,
    trip_no: 450096861,
    trip_date: "2024-01-15",
    departure_time: "15/01/2024 08:04",
    origin_id: 45,
    destination_id: 63,
    origin_name: "Umuahia",
    destination_name: "Lagos",
    narration: "UMUAHIA - LAGOS - AJAH",
    fare: 6500,
    total_seats: 15,
    available_seats: [1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    blocked_seats: [2, 3],
    special_seats: [],
    special_seats_fare: "",
    order_id: "eef50d24",
    departure_terminal: "UMUAHIA",
    destination_terminal: "LAGOS - AJAH",
    vehicle: "Hiace - 1st Bus (15)",
    boarding_at: "28",
    departure_address: "Umuahia Park",
    destination_address: "Ajah Terminal"
  },
  
  // ABC Transport - Abuja to Lagos
  {
    provider: {
      name: "ABC Transport",
      short_name: "ABC",
      logo: "https://travu.africa/providers/abc.jpg"
    },
    trip_id: 26528,
    trip_no: 4,
    trip_date: "2024-01-15",
    departure_time: "15/01/2024 06:00",
    origin_id: 13,
    destination_id: 25,
    origin_name: "Abuja",
    destination_name: "Lagos",
    narration: "GWAGWALADA TO LAGOS JIBOWU",
    fare: 14350,
    total_seats: 14,
    available_seats: [10, 11, 12, 13, 14],
    blocked_seats: [],
    special_seats: [],
    special_seats_fare: "",
    order_id: 20,
    departure_terminal: "GWAGWALADA",
    destination_terminal: "LAGOS JIBOWU",
    vehicle: "2+2, Sprinter Service, AC, Non-Video",
    boarding_at: "10",
    departure_address: "Ground Floor wing B Kaita Plaza, by Mtnoffice cls toJeparo Hotel",
    destination_address: "22 IKORODU ROAD JIBOWU"
  },
  
  // GUO Transport - Abuja to Lagos (Evening)
  {
    provider: {
      name: "GUO Transport",
      short_name: "GUO",
      logo: "https://travu.africa/providers/guo.jpg"
    },
    trip_id: 482850,
    trip_no: 30482850,
    trip_date: "2024-01-15",
    departure_time: "15/01/2024 20:01",
    origin_id: 14,
    destination_id: 64,
    origin_name: "Abuja",
    destination_name: "Lagos",
    narration: "UTAKO - LAGOS - COKER",
    fare: 10500,
    total_seats: 59,
    available_seats: [10, 11, 12, 13, 14, 15, 20, 25, 30],
    blocked_seats: [],
    special_seats: [],
    special_seats_fare: "",
    order_id: "de5426cf",
    departure_terminal: "UTAKO",
    destination_terminal: "LAGOS - COKER",
    vehicle: "Luxury - 1st Bus (59)",
    boarding_at: "",
    departure_address: "Gouba Plaza, Plot171, Ekukinam Street, Utako District, Abuja.",
    destination_address: "LAGOS - COKER Terminal"
  },
];

// ============================================
// MOCK API FUNCTIONS
// ============================================

/**
 * Mock Check Trip Request
 * Simulates POST https://api.travu.africa/api/v1/check_trip
 * 
 * @param {Object} params
 * @param {string} params.origin - Origin city name
 * @param {string} params.destination - Destination city name
 * @param {string} params.date - Trip date (YYYY-MM-DD)
 * @param {string} params.sort - Optional: 'date' or 'provider' (default)
 * @returns {Promise<Object>} Trip results
 */
const mockCheckTrip = async ({ origin, destination, date, sort = 'provider' }) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('🚌 Mock API - Checking trips:', { origin, destination, date, sort });

  // Filter trips based on search criteria
  let filteredTrips = MOCK_TRIPS.filter(trip => {
    const matchesOrigin = !origin || trip.origin_name.toLowerCase().includes(origin.toLowerCase());
    const matchesDestination = !destination || trip.destination_name.toLowerCase().includes(destination.toLowerCase());
    // Ignore date for mock data (always return trips)
    // const matchesDate = !date || trip.trip_date === date;
    
    return matchesOrigin && matchesDestination;
  });

  // If no trips found, return error
  if (filteredTrips.length === 0) {
    return {
      error: true,
      message: "failed",
      info: "No trips available for the selected route and date",
      data: []
    };
  }

  // Sort based on parameter
  if (sort === 'date') {
    // Sort by departure time and combine all providers
    filteredTrips.sort((a, b) => {
      return new Date(a.departure_time) - new Date(b.departure_time);
    });

    return {
      error: false,
      message: "successful",
      info: "Data Available",
      data: filteredTrips
    };
  } else {
    // Group by provider (default)
    const groupedByProvider = {};

    filteredTrips.forEach(trip => {
      const providerKey = trip.provider.short_name;
      
      if (!groupedByProvider[providerKey]) {
        groupedByProvider[providerKey] = {
          error: false,
          message: "successful",
          info: "Data Available",
          data: []
        };
      }
      
      groupedByProvider[providerKey].data.push(trip);
    });

    return groupedByProvider;
  }
};

/**
 * Mock Get Available Routes
 * Returns list of popular routes
 */
const mockGetRoutes = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    error: false,
    message: "successful",
    data: [
      { id: 1, origin: "Lagos", destination: "Abuja" },
      { id: 2, origin: "Lagos", destination: "Owerri" },
      { id: 3, origin: "Lagos", destination: "Enugu" },
      { id: 4, origin: "Abuja", destination: "Lagos" },
      { id: 5, origin: "Port Harcourt", destination: "Lagos" },
      { id: 6, origin: "Umuahia", destination: "Lagos" },
    ]
  };
};

/**
 * Mock Book Trip
 * Simulates booking a trip
 * 
 * @param {Object} bookingData
 * @param {number} bookingData.trip_id
 * @param {Array<number>} bookingData.seat_numbers
 * @param {Object} bookingData.passenger_info
 * @returns {Promise<Object>} Booking result
 */
const mockBookTrip = async (bookingData) => {
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log('🎫 Mock API - Booking trip:', bookingData);

  // Simulate successful booking
  return {
    error: false,
    message: "Booking successful",
    data: {
      booking_id: `BK${Date.now()}`,
      trip_id: bookingData.trip_id,
      seats: bookingData.seat_numbers,
      status: "confirmed",
      amount: bookingData.amount,
      reference: `REF${Date.now()}`,
      created_at: new Date().toISOString()
    }
  };
};

/**
 * Mock Get Booking Details
 * Retrieves booking information
 */
const mockGetBooking = async (bookingId) => {
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    error: false,
    message: "successful",
    data: {
      booking_id: bookingId,
      status: "confirmed",
      trip: MOCK_TRIPS[0],
      seats: [1, 2],
      passenger: {
        name: "John Doe",
        phone: "08012345678",
        email: "john@example.com"
      },
      amount: 36000,
      created_at: new Date().toISOString()
    }
  };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get unique origins from mock data
 */
const getAvailableOrigins = () => {
  const origins = [...new Set(MOCK_TRIPS.map(trip => trip.origin_name))];
  return origins.sort();
};

/**
 * Get unique destinations from mock data
 */
const getAvailableDestinations = () => {
  const destinations = [...new Set(MOCK_TRIPS.map(trip => trip.destination_name))];
  return destinations.sort();
};

/**
 * Get providers
 */
const getProviders = () => {
  const providers = MOCK_TRIPS.map(trip => trip.provider);
  const uniqueProviders = providers.filter((provider, index, self) =>
    index === self.findIndex((p) => p.short_name === provider.short_name)
  );
  return uniqueProviders;
};

/**
 * Check if seat is available
 */
const isSeatAvailable = (trip, seatNumber) => {
  return trip.available_seats.includes(seatNumber) && 
         !trip.blocked_seats.includes(seatNumber);
};

/**
 * Calculate total fare for selected seats
 */
const calculateTotalFare = (trip, seatNumbers) => {
  const baseFare = trip.fare * seatNumbers.length;
  
  // Check for special seats pricing
  const specialSeatsCount = seatNumbers.filter(seat => 
    trip.special_seats.includes(seat)
  ).length;
  
  const specialFare = specialSeatsCount * (trip.special_seats_fare || 0);
  
  return baseFare + specialFare;
};

// ============================================
// MODULE EXPORTS
// ============================================

module.exports = {
  checkTrip: mockCheckTrip,
  getRoutes: mockGetRoutes,
  bookTrip: mockBookTrip,
  getBooking: mockGetBooking,
  getAvailableOrigins,
  getAvailableDestinations,
  getProviders,
  isSeatAvailable,
  calculateTotalFare,
};