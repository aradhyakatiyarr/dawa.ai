export interface PharmacyStore {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  city: string;
  distance?: number;
}

export const storesDatabase: PharmacyStore[] = [
  // Delhi
  {
    id: "delhi-1",
    name: "Jan Aushadhi Kendra - Connaught Place",
    lat: 28.6304,
    lng: 77.2177,
    address: "Shop No 14, Outer Circle, Connaught Place, New Delhi - 110001",
    phone: "+91 11 2341 5566",
    city: "Delhi"
  },
  {
    id: "delhi-2",
    name: "Jan Aushadhi Store - AIIMS Campus",
    lat: 28.5672,
    lng: 77.2100,
    address: "AIIMS Shopping Complex, Ansari Nagar, New Delhi - 110029",
    phone: "+91 11 2659 4433",
    city: "Delhi"
  },
  {
    id: "delhi-3",
    name: "Jan Aushadhi Store - Lajpat Nagar",
    lat: 28.5694,
    lng: 77.2435,
    address: "Block K, Central Market, Lajpat Nagar II, New Delhi - 110024",
    phone: "+91 98112 34567",
    city: "Delhi"
  },
  // Bangalore
  {
    id: "blr-1",
    name: "Pradhan Mantri Bhartiya Janaushadhi Kendra - Indiranagar",
    lat: 12.97189,
    lng: 77.64115,
    address: "100 Feet Rd, near Doordarshan Kendra, Indiranagar, Bengaluru - 560038",
    phone: "+91 80 2521 8899",
    city: "Bangalore"
  },
  {
    id: "blr-2",
    name: "Jan Aushadhi Store - Jayanagar 4th Block",
    lat: 12.9284,
    lng: 77.5854,
    address: "Shopping Complex, 30th Cross Rd, Jayanagar, Bengaluru - 560011",
    phone: "+91 80 2244 3322",
    city: "Bangalore"
  },
  {
    id: "blr-3",
    name: "Jan Aushadhi Kendra - Malleshwaram",
    lat: 12.9961,
    lng: 77.5714,
    address: "Sample Building, 15th Cross Rd, Malleshwaram, Bengaluru - 560003",
    phone: "+91 94801 23456",
    city: "Bangalore"
  },
  // Mumbai
  {
    id: "mum-1",
    name: "Jan Aushadhi Store - Dadar West",
    lat: 19.0178,
    lng: 72.8428,
    address: "Opposite Dadar Station, Ranade Rd, Dadar West, Mumbai - 400028",
    phone: "+91 22 2430 7788",
    city: "Mumbai"
  },
  {
    id: "mum-2",
    name: "Jan Aushadhi Kendra - Andheri East",
    lat: 19.1154,
    lng: 72.8727,
    address: "Metro Station Exit 2, Andheri Kurla Rd, Andheri East, Mumbai - 400069",
    phone: "+91 22 2820 1122",
    city: "Mumbai"
  },
  // Hyderabad
  {
    id: "hyd-1",
    name: "Janaushadhi Kendra - Gachibowli",
    lat: 17.4483,
    lng: 78.3741,
    address: "DLF Cyber City Road, Gachibowli, Hyderabad - 500032",
    phone: "+91 40 2300 4455",
    city: "Hyderabad"
  },
  {
    id: "hyd-2",
    name: "Jan Aushadhi Store - Secunderabad",
    lat: 17.4399,
    lng: 78.5020,
    address: "Station Road, near Secunderabad West Metro, Secunderabad - 500003",
    phone: "+91 40 2780 9900",
    city: "Hyderabad"
  },
  // Chennai
  {
    id: "chn-1",
    name: "Janaushadhi Kendra - T. Nagar",
    lat: 13.0418,
    lng: 80.2341,
    address: "Pondy Bazaar, T. Nagar, Chennai - 600017",
    phone: "+91 44 2815 6677",
    city: "Chennai"
  }
];
