

/**
 * Shared Components Export
 * Centralized export for all shared components
 */





// Inputs
// export { default as PhoneInput } from './INPUT/PhoneInput';
export { default as AmountInput }from './INPUT/phoneInput';
export { default as PinInput }from './INPUT/pinInput';
export { default as BeneficiaryInput }from './INPUT/beneficiaryInput';

// Providers
export { default as ProviderSelector } from './PPROVIDER/providerSelector';


// Buttons
export { default as QuickAmountButton } from './BUTTONS/quickAmountButton';
export { default as PayButton } from './BUTTONS/payButton';
// Layout
export { default as ScreenHeader }from './LAYOUT/screenHeader';
export { default as TabSelector } from './LAYOUT/tableSelector';
export { default as LoadingOverlay } from './LAYOUT/loadingOverlay';
export { default as EmptyState } from './LAYOUT/emptyState'

// Modals
export { default as ConfirmationModal } from './MODAL/confirmationModal';
export { default as PinModal } from './MODAL/pinModal';
export { default as ResultModal }  from './MODAL/resultModal';

// Cards
export { default as TransactionSummaryCard }  from './CARDS/transactionSummaryCard';
export { default as PromoCard }  from './CARDS/promoCard';
export { default as WalletBalanceCard }from './CARDS/walletBalanceCrad';

// const Hom = () => {
//     return(
//         <View>
//             {WalletBalanceCard}
//         </View>
//     )
// }