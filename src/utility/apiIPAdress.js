

// Switch between RAILWAY (live test) and local IP for on-device dev
const BASE = 'https://payflexbackend-production-c40f.up.railway.app/api';
// const BASE = 'http://10.204.218.155:5000/api';

export const ApiIPAddress        = `${BASE}/auth`;
export const PaymentApiIPAddress = `${BASE}/payments`;
export const PayStackApiIPAddress = `${BASE}/payment`;
export const NINApiIPAddress     = BASE;
export const GeneralApiIPAddress = BASE;
export const InvoiceApiIPAddress = `${BASE}/invoices`;
// export const FlightApiIPAddress = 'http://10.38.133.155:5000/api/flights';



// $env:REACT_NATIVE_PACKAGER_HOSTNAME = " 10.173.66.155" ; npx expo start --clear


  







// setx /M REACT_NATIVE_PACKAGER_HOSTNAME  192.168.100.39
{/* <FlightStepIndicator currentStep={4} themeColors={themeColors} />   FlightSeatSelectionScreen: */}
{/* <FlightStepIndicator currentStep={5} themeColors={themeColors} /> PaymentScreen  */}

 