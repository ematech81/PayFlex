colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.22)']}

{/* Recent Transactions */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <TouchableOpacity>
                  <Text style={styles.viewAll}>See all</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                style={{ marginTop: 8 }}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.txRow}>
                    <View style={styles.txLeft}>
                      <View style={styles.txIcon}>
                        <Ionicons
                          name="receipt-outline"
                          size={18}
                          color="#4A00E0"
                        />
                      </View>
                      <View>
                        <Text style={styles.txTitle}>{item.title}</Text>
                        <Text style={styles.txDate}>{item.date}</Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        {
                          color: item.amount.startsWith('-')
                            ? '#FF4D4F'
                            : '#1B9C85',
                        },
                      ]}
                    >
                      {item.amount}
                    </Text>
                  </View>
                )}
              />
            </View>