// utils/parsePlans.js
export const parsePlans = (plans) => {
  // Plans to remove
  const excludedCodes = [
    'glo-wtf-25',
    'glo-wtf-50',
    'glo-wtf-100',
    'Glo-opera-25',
    'Glo-opera-50',
    'Glo-opera-100',
  ];

  return plans
    .filter((plan) => !excludedCodes.includes(plan.variation_code)) // remove unwanted
    .map((plan) => {
      // Add clean renewal info
      const isOneOff = plan.name.toLowerCase().includes('oneoff');

      return {
        ...plan,
        renewalInfo: isOneOff
          ? 'No auto renewal, renew manually'
          : 'Auto-renews if not cancelled',
      };
    });
};
