
/**
 * Safely extracts flight information from Amadeus flight offer structure
 * Handles various data structures and provides fallbacks
 */

export const getFlightOrigin = (flight) => {
  // Try different possible structures
  return (
    flight?.itineraries?.[0]?.segments?.[0]?.departure?.iataCode ||
    flight?.departure?.iataCode ||
    flight?.origin ||
    flight?.origin_code ||
    'N/A'
  );
};

export const getFlightDestination = (flight) => {
  const segments = flight?.itineraries?.[0]?.segments;
  const lastSegment = segments?.[segments.length - 1];
  
  return (
    lastSegment?.arrival?.iataCode ||
    flight?.arrival?.iataCode ||
    flight?.destination ||
    flight?.destination_code ||
    'N/A'
  );
};

export const getFlightOriginName = (flight) => {
  return (
    flight?.itineraries?.[0]?.segments?.[0]?.departure?.cityName ||
    flight?.itineraries?.[0]?.segments?.[0]?.departure?.locationName ||
    flight?.origin_name ||
    flight?.originName ||
    getFlightOrigin(flight)
  );
};

export const getFlightDestinationName = (flight) => {
  const segments = flight?.itineraries?.[0]?.segments;
  const lastSegment = segments?.[segments.length - 1];
  
  return (
    lastSegment?.arrival?.cityName ||
    lastSegment?.arrival?.locationName ||
    flight?.destination_name ||
    flight?.destinationName ||
    getFlightDestination(flight)
  );
};

export const getFlightDepartureDate = (flight) => {
  return (
    flight?.itineraries?.[0]?.segments?.[0]?.departure?.at ||
    flight?.departureDate ||
    flight?.departure_date ||
    new Date().toISOString()
  );
};

export const getFlightDepartureTime = (flight) => {
  const departureAt = getFlightDepartureDate(flight);
  if (!departureAt) return 'N/A';
  
  const date = new Date(departureAt);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

export const getFlightArrivalDate = (flight) => {
  const segments = flight?.itineraries?.[0]?.segments;
  const lastSegment = segments?.[segments.length - 1];
  
  return (
    lastSegment?.arrival?.at ||
    flight?.arrivalDate ||
    flight?.arrival_date ||
    new Date().toISOString()
  );
};

export const getFlightArrivalTime = (flight) => {
  const arrivalAt = getFlightArrivalDate(flight);
  if (!arrivalAt) return 'N/A';
  
  const date = new Date(arrivalAt);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

export const getFlightDuration = (flight) => {
  const duration = flight?.itineraries?.[0]?.duration || flight?.duration;
  if (!duration) return 'N/A';
  
  // Duration is in ISO 8601 format: PT2H30M
  const match = duration.match(/PT(\d+H)?(\d+M)?/);
  if (!match) return duration;
  
  const hours = match[1] ? match[1].replace('H', 'h ') : '';
  const minutes = match[2] ? match[2].replace('M', 'm') : '';
  
  return (hours + minutes).trim() || duration;
};

export const getFlightAirline = (flight) => {
  return (
    flight?.validatingAirlineCodes?.[0] ||
    flight?.itineraries?.[0]?.segments?.[0]?.carrierCode ||
    flight?.airline ||
    flight?.carrier ||
    'N/A'
  );
};

export const getFlightNumber = (flight) => {
  const segment = flight?.itineraries?.[0]?.segments?.[0];
  if (segment?.carrierCode && segment?.number) {
    return `${segment.carrierCode}${segment.number}`;
  }
  return flight?.flightNumber || flight?.flight_number || 'N/A';
};

export const getFlightPrice = (flight) => {
  return parseFloat(flight?.price?.total || flight?.price || flight?.amount || 0);
};

export const getFlightCurrency = (flight) => {
  return flight?.price?.currency || flight?.currency || 'NGN';
};

export const getNumberOfStops = (flight) => {
  const segments = flight?.itineraries?.[0]?.segments;
  if (!segments) return 0;
  return Math.max(0, segments.length - 1);
};

export const getStopsLabel = (flight) => {
  const stops = getNumberOfStops(flight);
  if (stops === 0) return 'Non-stop';
  if (stops === 1) return '1 stop';
  return `${stops} stops`;
};

export const formatFlightRoute = (flight) => {
  const origin = getFlightOrigin(flight);
  const destination = getFlightDestination(flight);
  return `${origin} → ${destination}`;
};

export const formatFlightDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    time: date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }),
    full: date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }),
  };
};

export const getFlightClass = (flight) => {
  return (
    flight?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ||
    flight?.class ||
    flight?.cabinClass ||
    'ECONOMY'
  );
};

export const getAircraftType = (flight) => {
  return (
    flight?.itineraries?.[0]?.segments?.[0]?.aircraft?.code ||
    flight?.aircraft ||
    'N/A'
  );
};

/**
 * Creates a summary object with all flight information
 * Use this to pass to payment/confirmation screens
 */
export const getFlightSummary = (flight) => {
  return {
    // Origin & Destination
    origin: getFlightOrigin(flight),
    originName: getFlightOriginName(flight),
    destination: getFlightDestination(flight),
    destinationName: getFlightDestinationName(flight),
    route: formatFlightRoute(flight),
    
    // Dates & Times
    departureDate: getFlightDepartureDate(flight),
    departureTime: getFlightDepartureTime(flight),
    arrivalDate: getFlightArrivalDate(flight),
    arrivalTime: getFlightArrivalTime(flight),
    duration: getFlightDuration(flight),
    
    // Flight Details
    airline: getFlightAirline(flight),
    flightNumber: getFlightNumber(flight),
    aircraft: getAircraftType(flight),
    class: getFlightClass(flight),
    stops: getNumberOfStops(flight),
    stopsLabel: getStopsLabel(flight),
    
    // Pricing
    price: getFlightPrice(flight),
    currency: getFlightCurrency(flight),
    
    // Raw data (for backend)
    rawData: flight,
  };
};

export default {
  getFlightOrigin,
  getFlightDestination,
  getFlightOriginName,
  getFlightDestinationName,
  getFlightDepartureDate,
  getFlightDepartureTime,
  getFlightArrivalDate,
  getFlightArrivalTime,
  getFlightDuration,
  getFlightAirline,
  getFlightNumber,
  getFlightPrice,
  getFlightCurrency,
  getNumberOfStops,
  getStopsLabel,
  formatFlightRoute,
  formatFlightDateTime,
  getFlightClass,
  getAircraftType,
  getFlightSummary,
};