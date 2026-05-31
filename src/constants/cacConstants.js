export const LINE_OF_BUSINESS = [
  'General merchandise',
  'Trading',
  'Fashion design/Tailoring',
  'ICT service',
  'Data analysis',
  'Poultry/Livestock farming',
  'Crop production farming/Agro allied service',
  'Hair stylist/salon',
  'Solar panel installation',
  'Digital marketing',
  'Graphic design',
  'Content creation',
  'Web design',
  'POS agent',
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

export const CAC_PRICING = {
  standard: 35000,
  priority: 38000,
};
