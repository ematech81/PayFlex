// src/screen/general/CACScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import {
  ScreenHeader,
  TabSelector,
  PayButton,
  ConfirmationModal,
  PinModal,
  ResultModal,
  LoadingOverlay,
} from 'component/SHARED';
import PinSetupModal from 'component/PinSetUpModal';

import { useServicePayment } from 'HOOKS/UseServicePayment';
import { useWallet } from 'context/WalletContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { colors } from 'constants/colors';
import { useThem } from 'constants/useTheme';
import { StatusBarComponent } from 'component/StatusBar';

import {
  cacValidateName,
  cacGetPrices,
  cacRegisterBusinessName,
  cacSearchBusiness,
} from 'AuthFunction/paymentService';

// ─── Constants ────────────────────────────────────────────────────────────────

const CAC_GRADIENT = ['#0d6e6e', '#14b8a6'];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

const SEARCH_TYPES = [
  { key: 'rc_number',    label: 'RC Number',       priceKey: 'basic',   icon: 'document-text-outline',  hint: 'Enter RC Number (e.g. RC123456)' },
  { key: 'company_name', label: 'Company Name',    priceKey: 'basic',   icon: 'business-outline',       hint: 'Enter registered company name' },
  { key: 'tin',          label: 'Tax ID (TIN)',    priceKey: 'basic',   icon: 'cash-outline',           hint: 'Enter TIN number' },
  { key: 'generate_tin', label: 'Generate TIN',   priceKey: 'basic',   icon: 'key-outline',            hint: 'Enter RC Number to generate TIN' },
  { key: 'vrc_share_distribution', label: 'Share Distribution', priceKey: 'vrc',     icon: 'pie-chart-outline',   hint: 'Enter VRC code' },
  { key: 'vrc_share_capital',      label: 'Share Capital',      priceKey: 'vrc',     icon: 'trending-up-outline', hint: 'Enter VRC code' },
  { key: 'vrc_assets',             label: 'Assets',             priceKey: 'vrc',     icon: 'cube-outline',        hint: 'Enter VRC code' },
  { key: 'vrc_status_report',      label: 'Status Report',      priceKey: 'premium', icon: 'stats-chart-outline', hint: 'Enter VRC code' },
  { key: 'vrc_certificate',        label: 'Certificate',        priceKey: 'premium', icon: 'ribbon-outline',      hint: 'Enter VRC code' },
  { key: 'vrc_wind_up',            label: 'Wind Up',            priceKey: 'premium', icon: 'close-circle-outline',hint: 'Enter VRC code' },
  { key: 'vrc_affiliates',         label: 'Affiliates',         priceKey: 'premium', icon: 'people-outline',      hint: 'Enter VRC code' },
  { key: 'vrc_company',            label: 'Company Report',     priceKey: 'premium', icon: 'clipboard-outline',   hint: 'Enter VRC code' },
];

const PRICE_TIER_LABELS = { basic: 'Basic', vrc: 'VRC Report', premium: 'Premium' };
const PRICE_TIER_COLORS = { basic: '#14b8a6', vrc: '#667EEA', premium: '#F093FB' };

// ─── Small reusable components ────────────────────────────────────────────────

const FormInput = ({ label, value, onChangeText, placeholder, error, themeColors, icon, keyboardType = 'default', maxLength, multiline = false }) => (
  <View style={styles.inputGroup}>
    <Text style={[styles.inputLabel, { color: themeColors.subheading }]}>{label}</Text>
    <View style={[styles.inputRow, { backgroundColor: themeColors.background, borderColor: error ? '#EF4444' : themeColors.border }]}>
      <Ionicons name={icon} size={18} color={error ? '#EF4444' : themeColors.subtext} style={styles.inputIcon} />
      <TextInput
        style={[styles.textInput, { color: themeColors.heading, height: multiline ? 72 : 44 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={themeColors.subtext}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
      />
    </View>
    {error ? <Text style={styles.inputError}>{error}</Text> : null}
  </View>
);

const SectionCard = ({ title, icon, gradientColors, themeColors, children }) => (
  <View style={[styles.card, { backgroundColor: themeColors.card }]}>
    <View style={styles.cardHeader}>
      <LinearGradient colors={gradientColors} style={styles.cardIconWrap}>
        <Ionicons name={icon} size={18} color="#fff" />
      </LinearGradient>
      <Text style={[styles.cardTitle, { color: themeColors.heading }]}>{title}</Text>
    </View>
    {children}
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function CACScreen({ navigation, route }) {
  const isDarkMode  = useThem();
  const themeColors = isDarkMode ? colors.dark : colors.light;
  const { wallet, refreshWallet } = useWallet();

  const [selectedTab, setSelectedTab] = useState('register');
  const [prices, setPrices]           = useState(null);
  const [pricesLoading, setPricesLoading] = useState(true);

  // ── Registration state ────────────────────────────────────────────────────
  const [proposedName,          setProposedName]          = useState('');
  const [nameCheckResult,       setNameCheckResult]       = useState(null);
  const [nameCheckLoading,      setNameCheckLoading]      = useState(false);
  const [natureOfBusiness,      setNatureOfBusiness]      = useState('');
  const [businessAddress,       setBusinessAddress]       = useState('');
  const [businessState,         setBusinessState]         = useState('');
  const [proprietorFirstName,   setProprietorFirstName]   = useState('');
  const [proprietorLastName,    setProprietorLastName]    = useState('');
  const [proprietorPhone,       setProprietorPhone]       = useState('');
  const [proprietorEmail,       setProprietorEmail]       = useState('');
  const [priorityService,       setPriorityService]       = useState(false);
  const [regErrors,             setRegErrors]             = useState({});
  const [lastRegRef,            setLastRegRef]            = useState(null);

  // ── Validation state ──────────────────────────────────────────────────────
  const [searchType,   setSearchType]   = useState('rc_number');
  const [searchParam,  setSearchParam]  = useState('');
  const [valErrors,    setValErrors]    = useState({});
  const [searchResult, setSearchResult] = useState(null);

  // ── Load prices on mount ──────────────────────────────────────────────────
  useEffect(() => {
    refreshWallet();
    cacGetPrices()
      .then(r => setPrices(r.prices))
      .catch(() => {})
      .finally(() => setPricesLoading(false));
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const selectedSearchType = SEARCH_TYPES.find(t => t.key === searchType) || SEARCH_TYPES[0];
  const regPrice  = prices ? (priorityService ? prices.businessName.priority : prices.businessName.standard) : null;
  const valPrice  = prices ? prices.validation[selectedSearchType.priceKey] : null;

  // ── Name availability check ───────────────────────────────────────────────
  const handleCheckName = useCallback(async () => {
    if (!proposedName.trim()) return;
    setNameCheckLoading(true);
    setNameCheckResult(null);
    try {
      const result = await cacValidateName(proposedName.trim());
      setNameCheckResult({ available: result.data?.statusCode === '000', message: result.data?.message || 'Check complete.' });
    } catch (err) {
      setNameCheckResult({ available: false, message: err.message || 'Name check failed. Please try again.' });
    } finally {
      setNameCheckLoading(false);
    }
  }, [proposedName]);

  // ── Registration validation ───────────────────────────────────────────────
  const validateRegistration = useCallback((data) => {
    const errors = {};
    if (!data.proposedName?.trim())        errors.proposedName        = 'Business name is required';
    if (!data.registrationData?.natureOfBusiness?.trim()) errors.natureOfBusiness = 'Nature of business is required';
    if (!data.registrationData?.businessAddress?.trim())  errors.businessAddress  = 'Business address is required';
    if (!data.registrationData?.businessState?.trim())    errors.businessState    = 'State is required';
    if (!data.registrationData?.proprietorFirstName?.trim()) errors.proprietorFirstName = 'First name is required';
    if (!data.registrationData?.proprietorLastName?.trim())  errors.proprietorLastName  = 'Last name is required';
    const phone = (data.registrationData?.proprietorPhone || '').replace(/\s/g, '');
    if (!phone)                           errors.proprietorPhone = 'Phone number is required';
    else if (!/^0\d{10}$/.test(phone))    errors.proprietorPhone = 'Enter a valid Nigerian phone number';
    if (data.registrationData?.proprietorEmail && !/\S+@\S+\.\S+/.test(data.registrationData.proprietorEmail)) {
      errors.proprietorEmail = 'Enter a valid email address';
    }
    const isValid = Object.keys(errors).length === 0;
    setRegErrors(errors);
    return { isValid, errors };
  }, []);

  // ── Search validation ─────────────────────────────────────────────────────
  const validateSearch = useCallback((data) => {
    const errors = {};
    if (!data.searchParam?.trim()) errors.searchParam = 'This field is required';
    const isValid = Object.keys(errors).length === 0;
    setValErrors(errors);
    return { isValid, errors };
  }, []);

  // ── Registration payment hook ─────────────────────────────────────────────
  const regPayment = useServicePayment({
    serviceName: 'CAC Registration',
    validatePayment: validateRegistration,
    executePurchase: async (pin, data) =>
      cacRegisterBusinessName(pin, {
        proposedName:     data.proposedName,
        registrationData: data.registrationData,
        priorityService:  data.priorityService,
      }),
    navigation,
    route,
  });

  // ── Validation payment hook ───────────────────────────────────────────────
  const valPayment = useServicePayment({
    serviceName: 'CAC Validation',
    validatePayment: validateSearch,
    executePurchase: async (pin, data) =>
      cacSearchBusiness(pin, data.validationType, data.searchParam),
    navigation,
    route,
  });

  // ── Payment handlers ──────────────────────────────────────────────────────
  const handleRegisterPay = useCallback(() => {
    setRegErrors({});
    regPayment.initiatePayment({
      proposedName,
      priorityService,
      registrationData: {
        natureOfBusiness,
        businessAddress,
        businessState,
        proprietorFirstName,
        proprietorLastName,
        proprietorPhone: proprietorPhone.replace(/\s/g, ''),
        proprietorEmail,
      },
    });
  }, [proposedName, priorityService, natureOfBusiness, businessAddress, businessState,
      proprietorFirstName, proprietorLastName, proprietorPhone, proprietorEmail, regPayment]);

  const handleSearchPay = useCallback(() => {
    setValErrors({});
    valPayment.initiatePayment({ validationType: searchType, searchParam: searchParam.trim() });
  }, [searchType, searchParam, valPayment]);

  const handleRegComplete = useCallback(() => {
    const ref = regPayment.result?.transactionRef;
    setLastRegRef(ref || null);
    regPayment.resetFlow();
  }, [regPayment]);

  const handleValComplete = useCallback(() => {
    if (valPayment.result?.data) setSearchResult(valPayment.result.data);
    valPayment.resetFlow();
  }, [valPayment]);

  // ── Render helpers ────────────────────────────────────────────────────────
  const tabs = [
    { label: 'Register BN', value: 'register' },
    { label: 'Validate', value: 'validate' },
  ];

  const walletBalance = wallet?.user?.walletBalance || 0;

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient colors={isDarkMode ? ['#0d2b2b', '#0d3d3d'] : CAC_GRADIENT} style={styles.headerGradient}>
        <ScreenHeader
          title="CAC Services"
          onBackPress={() => navigation.goBack()}
          rightText="History"
          onRightPress={() => navigation.navigate('Orders')}
          textColor="#fff"
          iconColor="#fff"
        />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Balance card */}
        <LinearGradient colors={CAC_GRADIENT} style={styles.balanceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Wallet Balance</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(walletBalance, 'NGN')}</Text>
            </View>
            <Ionicons name="business" size={36} color="rgba(255,255,255,0.85)" />
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabWrap}>
          <TabSelector tabs={tabs} selectedTab={selectedTab} onTabChange={setSelectedTab} />
        </View>

        {/* ═══════════════════ REGISTER TAB ═══════════════════════════════════ */}
        {selectedTab === 'register' && (
          <>
            {/* Pricing info */}
            {pricesLoading ? (
              <ActivityIndicator color={themeColors.primary} style={{ marginVertical: 12 }} />
            ) : prices && (
              <View style={[styles.pricingBanner, { backgroundColor: `${themeColors.primary}12` }]}>
                <Ionicons name="information-circle-outline" size={16} color={themeColors.primary} />
                <Text style={[styles.pricingText, { color: themeColors.subheading }]}>
                  Standard: {formatCurrency(prices.businessName.standard, 'NGN')}{'   '}
                  Priority: {formatCurrency(prices.businessName.priority, 'NGN')}
                </Text>
              </View>
            )}

            {/* Name availability check */}
            <SectionCard title="Business Name" icon="storefront-outline" gradientColors={CAC_GRADIENT} themeColors={themeColors}>
              <FormInput
                label="Proposed Business Name *"
                value={proposedName}
                onChangeText={(v) => { setProposedName(v); setNameCheckResult(null); }}
                placeholder="e.g. Acme Ventures Nigeria"
                error={regErrors.proposedName}
                themeColors={themeColors}
                icon="text-outline"
                maxLength={100}
              />
              <TouchableOpacity
                style={[styles.checkBtn, { opacity: proposedName.trim() && !nameCheckLoading ? 1 : 0.5 }]}
                onPress={handleCheckName}
                disabled={!proposedName.trim() || nameCheckLoading}
                activeOpacity={0.75}
              >
                {nameCheckLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="search-outline" size={16} color="#fff" />
                    <Text style={styles.checkBtnText}>Check Availability (Free)</Text>
                  </>
                )}
              </TouchableOpacity>
              {nameCheckResult && (
                <View style={[styles.nameResultRow, { backgroundColor: nameCheckResult.available ? '#d1fae5' : '#fee2e2' }]}>
                  <Ionicons
                    name={nameCheckResult.available ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={nameCheckResult.available ? '#059669' : '#DC2626'}
                  />
                  <Text style={[styles.nameResultText, { color: nameCheckResult.available ? '#065f46' : '#991b1b' }]}>
                    {nameCheckResult.message}
                  </Text>
                </View>
              )}
            </SectionCard>

            {/* Business details */}
            <SectionCard title="Business Details" icon="briefcase-outline" gradientColors={['#667EEA', '#764BA2']} themeColors={themeColors}>
              <FormInput label="Nature of Business *" value={natureOfBusiness} onChangeText={setNatureOfBusiness} placeholder="e.g. General trading, IT services" error={regErrors.natureOfBusiness} themeColors={themeColors} icon="construct-outline" />
              <FormInput label="Business Address *" value={businessAddress} onChangeText={setBusinessAddress} placeholder="Full business address" error={regErrors.businessAddress} themeColors={themeColors} icon="location-outline" multiline />
              <FormInput label="State *" value={businessState} onChangeText={setBusinessState} placeholder="e.g. Lagos" error={regErrors.businessState} themeColors={themeColors} icon="map-outline" />
            </SectionCard>

            {/* Proprietor details */}
            <SectionCard title="Proprietor Details" icon="person-outline" gradientColors={['#F093FB', '#F5576C']} themeColors={themeColors}>
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <FormInput label="First Name *" value={proprietorFirstName} onChangeText={setProprietorFirstName} placeholder="First name" error={regErrors.proprietorFirstName} themeColors={themeColors} icon="person-outline" />
                </View>
                <View style={styles.halfField}>
                  <FormInput label="Last Name *" value={proprietorLastName} onChangeText={setProprietorLastName} placeholder="Last name" error={regErrors.proprietorLastName} themeColors={themeColors} icon="person-outline" />
                </View>
              </View>
              <FormInput label="Phone Number *" value={proprietorPhone} onChangeText={setProprietorPhone} placeholder="08XXXXXXXXX" error={regErrors.proprietorPhone} themeColors={themeColors} icon="call-outline" keyboardType="phone-pad" maxLength={11} />
              <FormInput label="Email (optional)" value={proprietorEmail} onChangeText={setProprietorEmail} placeholder="email@example.com" error={regErrors.proprietorEmail} themeColors={themeColors} icon="mail-outline" keyboardType="email-address" />
            </SectionCard>

            {/* Service type */}
            <SectionCard title="Service Type" icon="rocket-outline" gradientColors={['#43E97B', '#38F9D7']} themeColors={themeColors}>
              <View style={styles.serviceTypeRow}>
                <View style={styles.serviceTypeLeft}>
                  <Text style={[styles.serviceTypeTitle, { color: themeColors.heading }]}>
                    {priorityService ? 'Priority Service' : 'Standard Service'}
                  </Text>
                  <Text style={[styles.serviceTypeSub, { color: themeColors.subtext }]}>
                    {priorityService
                      ? 'Faster processing + priority queue'
                      : 'Normal processing time'}
                  </Text>
                  {prices && (
                    <Text style={[styles.serviceTypePrice, { color: themeColors.primary }]}>
                      {formatCurrency(priorityService ? prices.businessName.priority : prices.businessName.standard, 'NGN')}
                    </Text>
                  )}
                </View>
                <Switch
                  value={priorityService}
                  onValueChange={setPriorityService}
                  trackColor={{ false: themeColors.border, true: '#14b8a6' }}
                  thumbColor={priorityService ? '#0d6e6e' : '#f4f3f4'}
                />
              </View>
            </SectionCard>

            {/* Register pay button */}
            <TouchableOpacity
              style={[styles.payBtn, { opacity: regPayment.step === 'processing' ? 0.6 : 1 }]}
              onPress={handleRegisterPay}
              disabled={regPayment.step === 'processing'}
              activeOpacity={0.8}
            >
              <LinearGradient colors={regPayment.step === 'processing' ? ['#9CA3AF', '#6B7280'] : CAC_GRADIENT} style={styles.payBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {regPayment.step === 'processing' ? (
                  <Text style={styles.payBtnText}>Processing...</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                    <Text style={styles.payBtnText}>
                      Submit Registration {regPrice ? `· ${formatCurrency(regPrice, 'NGN')}` : ''}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Inline flow error */}
            {regPayment.flowError && (
              <View style={styles.flowError}>
                <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                <Text style={styles.flowErrorText}>{regPayment.flowError}</Text>
              </View>
            )}

            {/* Last submission ref */}
            {lastRegRef && (
              <View style={[styles.refCard, { backgroundColor: themeColors.card }]}>
                <Ionicons name="receipt-outline" size={18} color={themeColors.primary} />
                <Text style={[styles.refText, { color: themeColors.subheading }]}>
                  Submitted · Ref: {lastRegRef}
                </Text>
              </View>
            )}
          </>
        )}

        {/* ═══════════════════ VALIDATE TAB ════════════════════════════════════ */}
        {selectedTab === 'validate' && (
          <>
            {/* Pricing info */}
            {prices && (
              <View style={[styles.pricingBanner, { backgroundColor: `${themeColors.primary}12` }]}>
                <Ionicons name="information-circle-outline" size={16} color={themeColors.primary} />
                <Text style={[styles.pricingText, { color: themeColors.subheading }]}>
                  Basic: {formatCurrency(prices.validation.basic, 'NGN')}{'  '}
                  VRC: {formatCurrency(prices.validation.vrc, 'NGN')}{'  '}
                  Premium: {formatCurrency(prices.validation.premium, 'NGN')}
                </Text>
              </View>
            )}

            {/* Search type selector */}
            <SectionCard title="Search Type" icon="search-outline" gradientColors={['#667EEA', '#764BA2']} themeColors={themeColors}>
              <View style={styles.searchTypeGrid}>
                {SEARCH_TYPES.map((t) => {
                  const isSelected = searchType === t.key;
                  const tierColor  = PRICE_TIER_COLORS[t.priceKey];
                  return (
                    <TouchableOpacity
                      key={t.key}
                      style={[
                        styles.searchTypeCard,
                        { backgroundColor: isSelected ? `${tierColor}18` : (isDarkMode ? '#2a2a3e' : '#F3F4F6') },
                        isSelected && { borderColor: tierColor, borderWidth: 1.5 },
                      ]}
                      onPress={() => { setSearchType(t.key); setSearchParam(''); setValErrors({}); setSearchResult(null); }}
                      activeOpacity={0.75}
                    >
                      <Ionicons name={t.icon} size={18} color={isSelected ? tierColor : themeColors.subtext} />
                      <Text style={[styles.searchTypeLabel, { color: isSelected ? tierColor : themeColors.heading }]} numberOfLines={2}>
                        {t.label}
                      </Text>
                      <View style={[styles.tierBadge, { backgroundColor: `${tierColor}22` }]}>
                        <Text style={[styles.tierBadgeText, { color: tierColor }]}>
                          {PRICE_TIER_LABELS[t.priceKey]}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </SectionCard>

            {/* Search input */}
            <SectionCard title="Search" icon="filter-outline" gradientColors={CAC_GRADIENT} themeColors={themeColors}>
              <FormInput
                label={`${selectedSearchType.label} *`}
                value={searchParam}
                onChangeText={(v) => { setSearchParam(v); setValErrors({}); }}
                placeholder={selectedSearchType.hint}
                error={valErrors.searchParam}
                themeColors={themeColors}
                icon={selectedSearchType.icon}
              />
              {valPrice && (
                <View style={[styles.pricePreviewRow, { backgroundColor: `${PRICE_TIER_COLORS[selectedSearchType.priceKey]}12` }]}>
                  <Ionicons name="wallet-outline" size={16} color={PRICE_TIER_COLORS[selectedSearchType.priceKey]} />
                  <Text style={[styles.pricePreviewText, { color: PRICE_TIER_COLORS[selectedSearchType.priceKey] }]}>
                    Cost: {formatCurrency(valPrice, 'NGN')}
                  </Text>
                </View>
              )}
            </SectionCard>

            {/* Search pay button */}
            <TouchableOpacity
              style={[styles.payBtn, { opacity: valPayment.step === 'processing' ? 0.6 : 1 }]}
              onPress={handleSearchPay}
              disabled={valPayment.step === 'processing'}
              activeOpacity={0.8}
            >
              <LinearGradient colors={valPayment.step === 'processing' ? ['#9CA3AF', '#6B7280'] : ['#667EEA', '#764BA2']} style={styles.payBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {valPayment.step === 'processing' ? (
                  <Text style={styles.payBtnText}>Processing...</Text>
                ) : (
                  <>
                    <Ionicons name="search" size={20} color="#fff" />
                    <Text style={styles.payBtnText}>
                      Search {valPrice ? `· ${formatCurrency(valPrice, 'NGN')}` : ''}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Flow error */}
            {valPayment.flowError && (
              <View style={styles.flowError}>
                <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                <Text style={styles.flowErrorText}>{valPayment.flowError}</Text>
              </View>
            )}

            {/* Search result card */}
            {searchResult && (
              <View style={[styles.resultCard, { backgroundColor: themeColors.card }]}>
                <View style={styles.resultCardHeader}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={[styles.resultCardTitle, { color: themeColors.heading }]}>Search Result</Text>
                </View>
                {Object.entries(searchResult).slice(0, 12).map(([k, v]) =>
                  typeof v !== 'object' ? (
                    <View key={k} style={[styles.resultRow, { borderBottomColor: themeColors.border }]}>
                      <Text style={[styles.resultKey, { color: themeColors.subtext }]}>{k}</Text>
                      <Text style={[styles.resultVal, { color: themeColors.heading }]} numberOfLines={3}>{String(v)}</Text>
                    </View>
                  ) : null
                )}
                <TouchableOpacity onPress={() => setSearchResult(null)} style={styles.clearResultBtn}>
                  <Text style={[styles.clearResultText, { color: themeColors.subtext }]}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── MODALS ─────────────────────────────────────────────────────────── */}

      {/* Registration modals */}
      <PinSetupModal
        visible={regPayment.showPinSetupModal}
        serviceName="CAC Registration"
        paymentAmount={regPrice}
        onCreatePin={regPayment.handleCreatePin}
        onCancel={regPayment.handleCancelPinSetup}
        isDarkMode={isDarkMode}
      />
      <ConfirmationModal
        visible={regPayment.step === 'confirm'}
        onClose={regPayment.handleCancelPayment}
        onConfirm={regPayment.confirmPayment}
        amount={regPrice}
        serviceName="CAC Business Name Registration"
        recipient={proposedName}
        recipientLabel="Business Name"
        walletBalance={walletBalance}
        loading={false}
      />
      <PinModal
        visible={regPayment.step === 'pin'}
        onClose={regPayment.handleCancelPayment}
        onSubmit={regPayment.submitPayment}
        onForgotPin={regPayment.handleForgotPin}
        loading={regPayment.step === 'processing'}
        error={regPayment.pinError}
        title="Confirm Registration"
        subtitle={regPrice ? `Authorise ₦${regPrice.toLocaleString()} for CAC registration` : 'Enter your transaction PIN'}
      />
      <ResultModal
        visible={regPayment.step === 'result'}
        onClose={regPayment.resetFlow}
        type={regPayment.result ? 'success' : 'error'}
        title={regPayment.result ? 'Registration Submitted!' : 'Submission Failed'}
        message={
          regPayment.result
            ? `Your Business Name registration for "${proposedName}" has been submitted. You will be notified once CAC approves your application.`
            : regPayment.flowError || 'Registration could not be submitted. Please try again.'
        }
        primaryAction={{ label: regPayment.result ? 'Done' : 'Retry', onPress: handleRegComplete }}
      />

      {/* Validation modals */}
      <PinSetupModal
        visible={valPayment.showPinSetupModal}
        serviceName="CAC Validation"
        paymentAmount={valPrice}
        onCreatePin={valPayment.handleCreatePin}
        onCancel={valPayment.handleCancelPinSetup}
        isDarkMode={isDarkMode}
      />
      <ConfirmationModal
        visible={valPayment.step === 'confirm'}
        onClose={valPayment.handleCancelPayment}
        onConfirm={valPayment.confirmPayment}
        amount={valPrice}
        serviceName={`CAC ${selectedSearchType.label}`}
        recipient={searchParam}
        recipientLabel={selectedSearchType.label}
        walletBalance={walletBalance}
        loading={false}
      />
      <PinModal
        visible={valPayment.step === 'pin'}
        onClose={valPayment.handleCancelPayment}
        onSubmit={valPayment.submitPayment}
        onForgotPin={valPayment.handleForgotPin}
        loading={valPayment.step === 'processing'}
        error={valPayment.pinError}
        title="Confirm Search"
        subtitle={valPrice ? `Authorise ₦${valPrice.toLocaleString()} for CAC validation` : 'Enter your transaction PIN'}
      />
      <ResultModal
        visible={valPayment.step === 'result'}
        onClose={valPayment.resetFlow}
        type={valPayment.result ? 'success' : 'error'}
        title={valPayment.result ? 'Search Complete' : 'Search Failed'}
        message={
          valPayment.result
            ? `${selectedSearchType.label} search completed. See results below.`
            : valPayment.flowError || 'Search could not be completed. Please try again.'
        }
        primaryAction={{ label: 'View Results', onPress: handleValComplete }}
        secondaryAction={{ label: 'Dismiss', onPress: valPayment.resetFlow }}
      />

      {/* Processing overlays */}
      <LoadingOverlay visible={regPayment.step === 'processing'} message="Submitting registration..." />
      <LoadingOverlay visible={valPayment.step === 'processing'} message="Searching CAC records..." />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:       { flex: 1 },
  headerGradient:  { paddingTop: StatusBar.currentHeight || 0 },
  scrollContent:   { padding: 16, paddingBottom: 32 },

  // Balance card
  balanceCard:     { borderRadius: 16, padding: 20, marginBottom: 16 },
  balanceRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel:    { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 },
  balanceAmount:   { color: '#fff', fontSize: 24, fontWeight: '700' },

  // Tab
  tabWrap:         { marginBottom: 16 },

  // Pricing banner
  pricingBanner:   { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, padding: 10, marginBottom: 12 },
  pricingText:     { fontSize: 12, flex: 1 },

  // Card
  card:            { borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardIconWrap:    { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  cardTitle:       { fontSize: 15, fontWeight: '600' },

  // Form input
  inputGroup:      { marginBottom: 12 },
  inputLabel:      { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  inputRow:        { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, minHeight: 44 },
  inputIcon:       { marginRight: 8 },
  textInput:       { flex: 1, fontSize: 14 },
  inputError:      { fontSize: 11, color: '#EF4444', marginTop: 4 },

  // Name check
  checkBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#14b8a6', borderRadius: 10, paddingVertical: 10, marginTop: 4 },
  checkBtnText:    { color: '#fff', fontSize: 13, fontWeight: '600' },
  nameResultRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 10, marginTop: 8 },
  nameResultText:  { fontSize: 13, flex: 1 },

  // Row layout (half fields)
  row:             { flexDirection: 'row', gap: 10 },
  halfField:       { flex: 1 },

  // Service type toggle
  serviceTypeRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serviceTypeLeft: { flex: 1, marginRight: 12 },
  serviceTypeTitle:{ fontSize: 15, fontWeight: '600', marginBottom: 2 },
  serviceTypeSub:  { fontSize: 12, marginBottom: 4 },
  serviceTypePrice:{ fontSize: 20, fontWeight: '700' },

  // Search type grid
  searchTypeGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  searchTypeCard:  { width: '31%', borderRadius: 12, padding: 10, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'transparent' },
  searchTypeLabel: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
  tierBadge:       { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  tierBadgeText:   { fontSize: 9, fontWeight: '700' },

  // Price preview
  pricePreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, padding: 8, marginTop: 8 },
  pricePreviewText:{ fontSize: 13, fontWeight: '600' },

  // Pay button
  payBtn:          { borderRadius: 14, overflow: 'hidden', marginVertical: 12 },
  payBtnGradient:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, paddingHorizontal: 24 },
  payBtnText:      { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Flow error
  flowError:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEE2E2', borderRadius: 10, padding: 10, marginBottom: 8 },
  flowErrorText:   { color: '#EF4444', fontSize: 13, flex: 1 },

  // Ref card
  refCard:         { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, marginBottom: 8 },
  refText:         { fontSize: 12, flex: 1 },

  // Search result card
  resultCard:         { borderRadius: 16, padding: 16, marginBottom: 12 },
  resultCardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resultCardTitle:    { fontSize: 15, fontWeight: '600' },
  resultRow:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  resultKey:          { fontSize: 12, flex: 1 },
  resultVal:          { fontSize: 12, fontWeight: '500', flex: 2, textAlign: 'right' },
  clearResultBtn:     { alignSelf: 'center', paddingTop: 12 },
  clearResultText:    { fontSize: 12 },
});
