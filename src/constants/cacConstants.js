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

export const LLC_NATURE_OF_BUSINESS = [
  { category: 'AGRICULTURE FORESTRY & FISHING',          items: ['CROP PRODUCTION', 'ANIMAL PRODUCTION', 'FORESTRY & LOGGING', 'FISHING & AQUACULTURE', 'SUPPORT ACTIVITIES FOR AGRICULTURE'] },
  { category: 'MINING & QUARRYING',                      items: ['MINING OF COAL', 'EXTRACTION OF CRUDE PETROLEUM & NATURAL GAS', 'MINING OF METAL ORES', 'OTHER MINING & QUARRYING'] },
  { category: 'MANUFACTURING',                           items: ['FOOD PRODUCTS', 'BEVERAGES', 'TEXTILES', 'WEARING APPAREL', 'LEATHER & RELATED PRODUCTS', 'PAPER & PAPER PRODUCTS', 'PRINTING & REPRODUCTION OF RECORDED MEDIA', 'CHEMICALS & CHEMICAL PRODUCTS', 'PHARMACEUTICALS & MEDICINAL PRODUCTS', 'RUBBER & PLASTICS PRODUCTS', 'OTHER NON-METALLIC MINERAL PRODUCTS', 'FABRICATED METAL PRODUCTS', 'ELECTRICAL EQUIPMENT', 'MOTOR VEHICLES', 'FURNITURE'] },
  { category: 'CONSTRUCTION',                            items: ['CONSTRUCTION OF BUILDINGS', 'CIVIL ENGINEERING', 'SPECIALISED CONSTRUCTION ACTIVITIES'] },
  { category: 'WHOLESALE & RETAIL TRADE',                items: ['WHOLESALE TRADE', 'RETAIL TRADE', 'MOTOR VEHICLES & MOTORCYCLES TRADE'] },
  { category: 'TRANSPORTATION & STORAGE',                items: ['LAND TRANSPORT', 'WATER TRANSPORT', 'AIR TRANSPORT', 'WAREHOUSING & SUPPORT ACTIVITIES', 'POSTAL & COURIER ACTIVITIES'] },
  { category: 'ACCOMMODATION & FOOD SERVICE',            items: ['HOTELS & ACCOMMODATION', 'FOOD & BEVERAGE SERVICE ACTIVITIES'] },
  { category: 'INFORMATION & COMMUNICATION',             items: ['PUBLISHING ACTIVITIES', 'MOTION PICTURE & VIDEO PRODUCTION', 'TELECOMMUNICATIONS', 'COMPUTER PROGRAMMING & SOFTWARE', 'INFORMATION SERVICE ACTIVITIES'] },
  { category: 'FINANCIAL & INSURANCE ACTIVITIES',        items: ['FINANCIAL SERVICE ACTIVITIES', 'INSURANCE & PENSION FUNDING', 'ACTIVITIES AUXILIARY TO FINANCIAL SERVICES'] },
  { category: 'REAL ESTATE ACTIVITIES',                  items: ['REAL ESTATE ACTIVITIES ON A FEE BASIS', 'BUYING & SELLING OF OWN REAL ESTATE', 'RENTING & OPERATING OF OWN REAL ESTATE'] },
  { category: 'PROFESSIONAL SCIENTIFIC & TECHNICAL',     items: ['LEGAL & ACCOUNTING', 'MANAGEMENT CONSULTANCY', 'ARCHITECTURAL & ENGINEERING', 'SCIENTIFIC RESEARCH & DEVELOPMENT', 'ADVERTISING & MARKET RESEARCH', 'VETERINARY ACTIVITIES'] },
  { category: 'ADMINISTRATIVE & SUPPORT SERVICE',        items: ['RENTAL & LEASING', 'EMPLOYMENT ACTIVITIES', 'TRAVEL AGENCY & TOUR OPERATOR', 'SECURITY & INVESTIGATION ACTIVITIES', 'CLEANING ACTIVITIES', 'OFFICE ADMINISTRATIVE ACTIVITIES'] },
  { category: 'EDUCATION',                               items: ['PRE-PRIMARY & PRIMARY EDUCATION', 'SECONDARY EDUCATION', 'HIGHER EDUCATION', 'OTHER EDUCATION', 'EDUCATIONAL SUPPORT ACTIVITIES'] },
  { category: 'HEALTH & SOCIAL WORK',                    items: ['HOSPITAL ACTIVITIES', 'MEDICAL & DENTAL PRACTICE', 'NURSING & RESIDENTIAL CARE', 'SOCIAL WORK ACTIVITIES'] },
  { category: 'ARTS ENTERTAINMENT & RECREATION',         items: ['CREATIVE ARTS & ENTERTAINMENT', 'LIBRARIES ARCHIVES MUSEUMS', 'GAMBLING & BETTING', 'SPORTS & RECREATION'] },
  { category: 'OTHER SERVICE ACTIVITIES',                items: ['REPAIR OF MOTOR VEHICLES', 'REPAIR OF HOUSEHOLD GOODS', 'HAIRDRESSING & BEAUTY TREATMENT', 'FUNERAL & RELATED ACTIVITIES', 'OTHER PERSONAL SERVICE ACTIVITIES'] },
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
