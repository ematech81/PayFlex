// utils/styles.js
export const inputStyle = (theme) => ({
  backgroundColor: theme.card,
  color: theme.heading,
  padding: 16,
  borderRadius: 12,
  marginBottom: 12,
  fontSize: 16,
});

export const btnStyle = (theme) => ({
  backgroundColor: theme.primary,
  padding: 16,
  borderRadius: 12,
  alignItems: 'center',
});

export const btnText = (theme) => ({
  color: theme.card,
  fontWeight: 'bold',
  fontSize: 16,
});

export const otpBox = (theme) => ({
  width: 40,
  height: 56,
  borderRadius: 12,
  backgroundColor: theme.card,
  textAlign: 'center',
  fontSize: 24,
  fontWeight: 'bold',
  color: theme.heading,
  borderWidth: 2,
  borderColor: theme.border,
});