
return (
      <View style={[styles.customerCard, { backgroundColor: `${themeColors.success}20` }]}>
        <Text style={[styles.customerCardTitle, { color: themeColors.success }]}>
          ✓ Customer Verified
        </Text>
        <View style={styles.customerRow}>
          <Text style={[styles.customerLabel, { color: themeColors.mutedText }]}>Name:</Text>
          <Text style={[styles.customerValue, { color: themeColors.text }]}>
            {customerData.customerName}
          </Text>
        </View>
        {customerData.currentBouquet && (
          <View style={styles.customerRow}>
            <Text style={[styles.customerLabel, { color: themeColors.mutedText }]}>
              Current Package:
            </Text>
            <Text style={[styles.customerValue, { color: themeColors.text }]}>
              {customerData.currentBouquet}
            </Text>
          </View>
        )}
        {customerData.renewalAmount && (
          <View style={styles.customerRow}>
            <Text style={[styles.customerLabel, { color: themeColors.mutedText }]}>
              Renewal Amount:
            </Text>
            <Text style={[styles.customerValue, { color: themeColors.text }]}>
              {formatCurrency(parseFloat(customerData.renewalAmount), 'NGN')}
            </Text>
          </View>
        )}
        {customerData.dueDate && (
          <View style={styles.customerRow}>
            <Text style={[styles.customerLabel, { color: themeColors.mutedText }]}>Due Date:</Text>
            <Text style={[styles.customerValue, { color: themeColors.text }]}>
              {customerData.dueDate}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderBouquetCard = ({ item: bouquet }) => {
    const isSelected = selectedBouquet?.variation_code === bouquet.variation_code;
    const price = parseFloat(bouquet.variation_amount || 0);
    const cleanName = cleanBouquetName(bouquet);

    return (
      <TouchableOpacity
        key={bouquet.variation_code}
        style={[
          styles.bouquetCard,
          { 
            backgroundColor: isSelected ? `${themeColors.primary}20` : themeColors.card,
            borderColor: isSelected ? themeColors.primary : themeColors.border,
          },
        ]}
        onPress={() => setSelectedBouquet(bouquet)}
      >
        <View style={styles.bouquetInfo}>
          <Text style={[styles.bouquetName, { color: themeColors.text }]}>
            {cleanName}
          </Text>
          <Text style={[styles.bouquetPrice, { color: themeColors.primary }]}>
            {formatCurrency(price, 'NGN')}
          </Text>
        </View>
        {isSelected && (
          <Text style={[styles.checkmark, { color: themeColors.primary }]}>✓</Text>
        )}
      </TouchableOpacity>
    );
  };

  // ========================================
  // Main Render
  // ========================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
    <StatusBar
           barStyle= { isDarkMode ? 'light-content' : 'dark-content'}
          //  barStyle= "dark-content"
           backgroundColor="transparent"
           translucent
         />
      <View style={styles.mainContainer}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <ScreenHeader
            title="TV Sub"
            onBackPress={() => navigation.goBack()}
            rightText="History"
            onRightPress={() => navigation.navigate('History')}
          />

          {/* Provider Selection */}
          <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
            Select TV Provider
          </Text>
          <ProviderSelector
            providers={TV_PROVIDERS}
            value={provider}
            onChange={(value) => {
              setProvider(value);
              setCustomerData(null);
              setSmartcardNumber('');
              setSelectedBouquet(null);
            }}
            placeholder="Select TV Provider"
            error={validationErrors.provider}
          />

          {/* Smartcard Number Input */}
          <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
            Smartcard / IUC Number
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                { 
                  color: themeColors.text, 
                  borderColor: validationErrors.smartcard ? themeColors.destructive : themeColors.border,
                  backgroundColor: themeColors.card,
                },
              ]}
              value={smartcardNumber}
              onChangeText={(text) => {
                setSmartcardNumber(text.replace(/\D/g, ''));
                setValidationErrors({ ...validationErrors, smartcard: undefined });
                setCustomerData(null);
              }}
              placeholder="Enter 10-11 digit number"
              placeholderTextColor={themeColors.mutedText}
              keyboardType="numeric"
              maxLength={11}
              editable={!isVerifying}
            />
            <TouchableOpacity
              style={[
                styles.verifyButton,
                { backgroundColor: (!provider || !smartcardNumber || isVerifying) 
                    ? themeColors.subheading 
                    : themeColors.primary 
                },
              ]}
              onPress={handleVerifySmartcard}
              disabled={isVerifying || !provider || !smartcardNumber}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
          {validationErrors.smartcard && (
            <Text style={[styles.errorText, { color: themeColors.destructive }]}>
              {validationErrors.smartcard}
            </Text>
          )}

          {/* Customer Info */}
          {renderCustomerInfo()}

          ,
          {/* Error Display */}
          {payment.flowError && (
            <View style={[styles.errorContainer, { backgroundColor: `${themeColors.destructive}20` }]}>
              <Text style={[styles.errorText, { color: themeColors.destructive }]}>
                {payment.flowError}
              </Text>
            </View>
          )}

      
        <View style={styles.bottomSpacer} />
 

          {/* Promo Card */}
          <PromoCard
            title="🎉 Get Rewards"
            subtitle="Earn cashback on every TV subscription"
            buttonText="Learn More"
            onPress={() => navigation.navigate('Rewards')}
          />
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Sticky Pay Button */}
        {canProceed() && (
        <View style={[styles.stickyFooter, { backgroundColor: themeColors.background }]}>
          <PayButton
            title={`Pay ${formatCurrency(getAmount(), 'NGN')}`}
            onPress={handlePayment}
            disabled={!canProceed()}
            loading={payment.step === 'processing'}
            style={styles.payButton}
          />
        </View>
      )}
      </View>

      {/* ========================================
          MODALS
          ======================================== */}

      {/* PIN Setup Modal */}
      <PinSetupModal
        visible={payment.showPinSetupModal}
        serviceName="TV Subscription"
        paymentAmount={getAmount()}
        onCreatePin={payment.handleCreatePin}
        onCancel={payment.handleCancelPinSetup}
        isDarkMode={isDarkMode}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={payment.step === 'confirm'}
        onClose={payment.handleCancelPayment}
        onConfirm={payment.confirmPayment}
        amount={getAmount()}
        serviceName="TV Subscription"
        providerName={provider.toUpperCase()}
        recipient={smartcardNumber}
        recipientLabel="Smartcard Number"
        additionalInfo={
          subscriptionType === 'renew'
            ? `Renew: ${customerData?.currentBouquet}`
            : `Package: ${cleanBouquetName(selectedBouquet)}`
        }
        walletBalance={wallet?.user?.walletBalance}
        loading={false}
      />

      {/* PIN Input Modal */}
      <PinModal
        visible={payment.step === 'pin'}
        onClose={payment.handleCancelPayment}
        onSubmit={payment.submitPayment}
        onForgotPin={payment.handleForgotPin}
        loading={payment.step === 'processing'}
        error={payment.pinError}
        title="Enter Transaction PIN"
        subtitle={`Confirm payment of ${formatCurrency(getAmount(), 'NGN')}`}
      />

      {/* Success/Error Result Modal */}
      <ResultModal
        visible={payment.step === 'result'}
        onClose={() => {
          payment.resetFlow();
          setSmartcardNumber('');
          setProvider('');
          setSelectedBouquet(null);
          setCustomerData(null);
        }}
        type={payment.result ? 'success' : 'error'}
        title={payment.result ? 'Subscription Successful!' : 'Subscription Failed'}
        message={
          payment.result
            ? `Your TV subscription of ${formatCurrency(getAmount(), 'NGN')} was successful.`
            : payment.flowError || 'Your TV subscription could not be completed. Please try again.'
        }
        primaryAction={{
          label: 'View Details',
          onPress: handleTransactionComplete,
        }}
        secondaryAction={{
          label: 'Done',
          onPress: () => {
            payment.resetFlow();
            setSmartcardNumber('');
            setProvider('');
            setSelectedBouquet(null);
            setCustomerData(null);
          },
        }}
      />

      {/* Processing Overlay */}
      <LoadingOverlay
        visible={payment.step === 'processing'}
        message="Processing your payment..."
      />
    </SafeAreaView>
  );
}


I want you to help me solve the issue in the code below on how I render the footer component with the pay button.

This is how the flow should be.
After the smart card is verified, the packages load. 
if the subscription type is "change package", the packages are listed on the UI. Selecting any package will show the footer with the pay button.

Also, when the "renew" subscription type is selected, all we need to show is the pay button with the customer's renewal amount. It should show the footer component with the pay button and the customer's renewal amount.

The issue:
The footer and the pay button do not show when the "renew" subscription type is selected.

Task:
help me make the pay button show when the renew subscription type is selected.





