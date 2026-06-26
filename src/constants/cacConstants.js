export const LINE_OF_BUSINESS = [
  'General merchandise',
  'Trading',
  'Fashion design/Tailoring',
  'Clothing and accessories',
  'Footwear and leather goods',
  'Retail sales',
  'Wholesale distribution',
  'ICT service',
  'Data analysis',
  'Software development',
  'Digital marketing',
  'Graphic design',
  'Content creation',
  'Web design',
  'Food and beverages',
  'Restaurant/Catering',
  'Bakery/Confectionery',
  'Hair stylist/salon',
  'Beauty/Cosmetics',
  'Spa and wellness',
  'Poultry/Livestock farming',
  'Crop production farming/Agro allied service',
  'Solar panel installation',
  'Electrical/Electronics repair',
  'Plumbing/Construction works',
  'Logistics/Dispatch',
  'Photography/Videography',
  'Event planning',
  'POS agent',
  'Bureau de change',
  'Real estate/Property management',
  'Printing/Publishing',
  'Education/Tutoring',
  'Healthcare/Medical services',
  'Laundry/Dry cleaning',
  'Auto repair/Spare parts',
  'Interior decoration',
  'Importation/Exportation',
];

export const PROHIBITED_WORDS = [
  'wealth','company','empire','investment','finance','force','state',
  'national','federal','cooperative','limited','betting','sport',
  'construction','mining','quarry','exploration','mosque','church',
  'institute','cash','monie','money','foundation','bank','center',
  'centre','lmt','ltd','inc','holding','group','consortium','funds',
  'exchange','moni','incorporated','academy','school','ex','fx','apostolic',
];

export const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue',
  'Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara',
  'Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau',
  'Rivers','Sokoto','Taraba','Yobe','Zamfara','F.C.T',
];

export const COMPLIANCE_MESSAGES = {
  '00': { label: 'Name available',                                         color: '#4CAF50', canProceed: true  },
  '01': { label: 'Offensive language detected',                            color: '#EF4444', canProceed: false },
  '02': { label: 'Add a qualifier (e.g. ventures, concepts, enterprises)', color: '#EF4444', canProceed: false },
  '03': { label: 'Name accepted — proficiency certificate required',       color: '#FF9800', canProceed: true  },
  '04': { label: 'Line of business requires certificate',                  color: '#FF9800', canProceed: true  },
  '05': { label: 'Name contains prohibited word',                          color: '#EF4444', canProceed: false },
  '06': { label: 'Line of business contains prohibited word',              color: '#EF4444', canProceed: false },
  '07': { label: 'Business name already exists',                           color: '#EF4444', canProceed: false },
  '08': { label: 'Name too similar to existing business',                  color: '#EF4444', canProceed: false },
  '10': { label: 'Name must be more than one word',                        color: '#EF4444', canProceed: false },
  '11': { label: 'Religious connotation not allowed',                      color: '#EF4444', canProceed: false },
  '12': { label: 'Special characters not allowed',                         color: '#EF4444', canProceed: false },
  '13': { label: 'Multiple qualifiers detected',                           color: '#EF4444', canProceed: false },
  '14': { label: 'Qualifier must be at end of name',                       color: '#EF4444', canProceed: false },
};

// ─── LLC Constants ────────────────────────────────────────────────────────────

export const LLC_COMPANY_TYPES = [
  { value: 'PRIVATE_COMPANY_LIMITED_BY_SHARES', label: 'Private Company Limited by Shares' },
  { value: 'PRIVATE_UNLIMITED_COMPANY',         label: 'Private Unlimited Company' },
  { value: 'PUBLIC_COMPANY_LIMITED_BY_SHARES',  label: 'Public Company Limited by Shares' },
  { value: 'PUBLIC_UNLIMITED_COMPANY',          label: 'Public Unlimited Company' },
];

// category = exact VAS category_name string (sent to the CAC VAS API)
// label    = display-friendly name shown in the UI picker
// id       = VAS category_id (for future use)
export const LLC_NATURE_OF_BUSINESS = [
  { id: 'NKIEuD', label: 'Agriculture, Forestry & Fishing',        category: 'AGRICULTURE FORESTRY & FISHING',                                                                                                                items: ['CROP PRODUCTION', 'ANIMAL PRODUCTION', 'FORESTRY & LOGGING', 'FISHING & AQUACULTURE', 'SUPPORT ACTIVITIES FOR AGRICULTURE'] },
  { id: 'RO7lKn', label: 'Mining & Quarrying',                      category: 'MINING AND QUARRYING',                                                                                                                           items: ['MINING OF COAL', 'EXTRACTION OF CRUDE PETROLEUM & NATURAL GAS', 'MINING OF METAL ORES', 'OTHER MINING & QUARRYING'] },
  { id: 't1SBBB', label: 'Manufacturing',                            category: 'MANUFACTURING',                                                                                                                                  items: ['FOOD PRODUCTS', 'BEVERAGES', 'TEXTILES', 'WEARING APPAREL', 'LEATHER & RELATED PRODUCTS', 'PAPER & PAPER PRODUCTS', 'PRINTING & REPRODUCTION OF RECORDED MEDIA', 'CHEMICALS & CHEMICAL PRODUCTS', 'PHARMACEUTICALS & MEDICINAL PRODUCTS', 'RUBBER & PLASTICS PRODUCTS', 'OTHER NON-METALLIC MINERAL PRODUCTS', 'FABRICATED METAL PRODUCTS', 'ELECTRICAL EQUIPMENT', 'MOTOR VEHICLES', 'FURNITURE'] },
  { id: 'BNj70U', label: 'Water Supply & Waste Management',          category: 'WATERSUPPLY,SEWERAGE,WASTEMANAGEMENT AND REMEDIATION ACTIVITIES',                                                                                items: ['WATER SUPPLY', 'SEWERAGE', 'WASTE MANAGEMENT', 'REMEDIATION ACTIVITIES'] },
  { id: 'h7LdKK', label: 'Construction',                             category: 'CONSTRUCTION',                                                                                                                                   items: ['CONSTRUCTION OF BUILDINGS', 'CIVIL ENGINEERING', 'SPECIALISED CONSTRUCTION ACTIVITIES'] },
  { id: 'K7u5fK', label: 'Wholesale & Retail Trade',                 category: 'WHOLESALE AND RETAIL TRADE;REPAIR OF MOTOR VEHICLES AND MOTOR VEHICLES AND MOTORCYCLES',                                                         items: ['WHOLESALE TRADE', 'RETAIL TRADE', 'MOTOR VEHICLES & MOTORCYCLES TRADE'] },
  { id: 'bSnJoM', label: 'Transportation & Storage',                 category: 'TRANSPORTATION',                                                                                                                                  items: ['LAND TRANSPORT', 'WATER TRANSPORT', 'AIR TRANSPORT', 'WAREHOUSING & SUPPORT ACTIVITIES', 'POSTAL & COURIER ACTIVITIES'] },
  { id: 'NjEVqd', label: 'Accommodation & Food Services',            category: 'ACCOMODATION AND FOOD SERVICES ACTIVITIES',                                                                                                     items: ['HOTELS & ACCOMMODATION', 'FOOD & BEVERAGE SERVICE ACTIVITIES'] },
  { id: 'uoj8LN', label: 'Information & Communication',              category: 'INFORMATION AND COMMUNICATION',                                                                                                                  items: ['PUBLISHING ACTIVITIES', 'MOTION PICTURE & VIDEO PRODUCTION', 'TELECOMMUNICATIONS', 'COMPUTER PROGRAMMING & SOFTWARE', 'INFORMATION SERVICE ACTIVITIES'] },
  { id: 'Bo7Jis', label: 'Financial & Insurance',                    category: 'FINANCIAL AND INSURANCE ACTIVITIES',                                                                                                             items: ['FINANCIAL SERVICE ACTIVITIES', 'INSURANCE & PENSION FUNDING', 'ACTIVITIES AUXILIARY TO FINANCIAL SERVICES'] },
  { id: 'RarMbO', label: 'Real Estate',                              category: 'REAL ESTATE ACTIVITIES',                                                                                                                         items: ['REAL ESTATE ACTIVITIES ON A FEE BASIS', 'BUYING & SELLING OF OWN REAL ESTATE', 'RENTING & OPERATING OF OWN REAL ESTATE'] },
  { id: 'ogTJd0', label: 'Professional, Scientific & Technical',     category: 'PROFESSIONAL,SCIENTIFIC AND TECHNICAL ACTIVITIES',                                                                                               items: ['LEGAL & ACCOUNTING', 'MANAGEMENT CONSULTANCY', 'ARCHITECTURAL & ENGINEERING', 'SCIENTIFIC RESEARCH & DEVELOPMENT', 'ADVERTISING & MARKET RESEARCH', 'VETERINARY ACTIVITIES'] },
  { id: 'g6xUlQ', label: 'Administrative & Support Services',        category: 'ADMINISTRATIVE AND SUPPORT SERVICES ACTIVITIES',                                                                                                 items: ['RENTAL & LEASING', 'EMPLOYMENT ACTIVITIES', 'TRAVEL AGENCY & TOUR OPERATOR', 'SECURITY & INVESTIGATION ACTIVITIES', 'CLEANING ACTIVITIES', 'OFFICE ADMINISTRATIVE ACTIVITIES'] },
  { id: 'yW5mZJ', label: 'Public Administration & Defence',          category: 'PUBLIC ADMINISTRATION AND DEFENCE;DEFENCE, COMPULSORY SOCIAL SECURITY',                                                                          items: ['PUBLIC ADMINISTRATION', 'COMPULSORY SOCIAL SECURITY', 'DEFENCE'] },
  { id: 'wq7jrJ', label: 'Education',                                category: 'EDUCATION',                                                                                                                                      items: ['PRE-PRIMARY & PRIMARY EDUCATION', 'SECONDARY EDUCATION', 'HIGHER EDUCATION', 'OTHER EDUCATION', 'EDUCATIONAL SUPPORT ACTIVITIES'] },
  { id: 'rHK0fb', label: 'Health & Social Work',                     category: 'HUMAN HEALTH AND SOCIAL WORK ACTIVITIES',                                                                                                        items: ['HOSPITAL ACTIVITIES', 'MEDICAL & DENTAL PRACTICE', 'NURSING & RESIDENTIAL CARE', 'SOCIAL WORK ACTIVITIES'] },
  { id: 'JsOw4R', label: 'Arts, Entertainment & Recreation',         category: 'ART, ENTERTAINMENT AND RECREATION',                                                                                                              items: ['CREATIVE ARTS & ENTERTAINMENT', 'LIBRARIES ARCHIVES MUSEUMS', 'GAMBLING & BETTING', 'SPORTS & RECREATION'] },
  { id: 'hR4Fn6', label: 'Other Service Activities',                 category: 'OTHER SERVICE ACTIVITIES',                                                                                                                       items: ['REPAIR OF HOUSEHOLD GOODS', 'HAIRDRESSING & BEAUTY TREATMENT', 'FUNERAL & RELATED ACTIVITIES', 'OTHER PERSONAL SERVICE ACTIVITIES'] },
  { id: 'tN4w5j', label: 'Household Activities',                     category: 'ACTIVITIES OF HOUSE AS EMPLOYMENT UNDIFFERENTIATED GOODS-AND SERVICES-PRODUCING ACTIVITIES OF HOUSEHOLDS FOR OWN USE',                          items: ['HOUSEHOLD EMPLOYMENT ACTIVITIES', 'GOODS-PRODUCING ACTIVITIES', 'SERVICES-PRODUCING ACTIVITIES'] },
  { id: '4v7TfM', label: 'Extraterritorial Organisations',            category: 'ACTIVITIES OF EXTRATERRITORIAL ORGANISATION AND BODIES',                                                                                         items: ['EXTRATERRITORIAL ORGANISATION ACTIVITIES', 'INTERNATIONAL BODIES ACTIVITIES'] },
  { id: 'H1BrRX', label: 'Faith Based Association',                  category: 'FAITH BASED ASSOCIATION',                                                                                                                        items: ['RELIGIOUS ACTIVITIES', 'FAITH-BASED COMMUNITY SERVICE'] },
  { id: 'oWAlAc', label: 'Social Clubs Association',                 category: 'SOCIAL CLUBS BASED ASSOCIATION',                                                                                                                 items: ['SOCIAL CLUB ACTIVITIES'] },
  { id: 'hAi0CG', label: 'Cultural Association',                     category: 'CULTURAL BASED ASSOCIATION',                                                                                                                     items: ['CULTURAL ACTIVITIES'] },
  { id: 'hOixw0', label: 'Sporting Association',                     category: 'SPORTING BASED ASSOCIATION',                                                                                                                     items: ['SPORTING ACTIVITIES'] },
  { id: '4JGVQu', label: 'Foundation',                               category: 'FOUNDATION BASED ASSOCIATION',                                                                                                                   items: ['FOUNDATION ACTIVITIES', 'PHILANTHROPIC ACTIVITIES'] },
  { id: 'SBw3D1', label: 'Community Based Association',              category: 'COMMUNITY BASED ASSOCIATION',                                                                                                                    items: ['COMMUNITY DEVELOPMENT', 'COMMUNITY SERVICE ACTIVITIES'] },
  { id: 'mxD4H2', label: 'Motor Vehicle & Motorcycle Repairs',       category: 'REPAIRS OF MOTORVEHICLES AND MOTORCYCLES',                                                                                                       items: ['MOTOR VEHICLE REPAIRS', 'MOTORCYCLE REPAIRS', 'AUTO PARTS & ACCESSORIES'] },
  { id: 'heZ21p', label: 'Power & Energy',                           category: 'POWER',                                                                                                                                          items: ['ELECTRICITY GENERATION', 'ELECTRICITY DISTRIBUTION', 'RENEWABLE ENERGY'] },
  { id: 'YTgsHX', label: 'Other Extra-Territorial Activities',       category: 'OTHER ACTIVITIES OF EXTRA-TERRITORIAL ORGANIZATION AND BODIES',                                                                                  items: ['EXTRA-TERRITORIAL ACTIVITIES'] },
];

export const LLC_AFFILIATE_TYPES = [
  { value: 'director',     label: 'Director' },
  { value: 'shareholder',  label: 'Shareholder' },
  { value: 'secretary',    label: 'Secretary' },
  { value: 'witness',      label: 'Witness' },
];

export const LLC_STATUS_LABELS = {
  name_reserved:       'Name Reserved',
  memorandum_done:     'Memorandum Ready',
  company_created:     'Company Created',
  shares_registered:   'Shares Registered',
  affiliates_complete: 'Affiliates Complete',
  failed:              'Failed',
  cancelled:           'Cancelled',
};

// ─── BN Pricing ───────────────────────────────────────────────────────────────

export const CAC_PRICING = {
  standard: 35000,
  priority: 38000,
};
