import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PASSENGER_TITLES } from 'CONSTANT/bookingConstants';

export default function EditPassengerModal({ visible, passenger, index, onSave, onClose, tc }) {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const isPrimary = index === 0;

  useEffect(() => {
    if (visible) { setForm({ ...passenger }); setErrors({}); }
  }, [visible, passenger]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.fullName?.trim()) e.fullName = 'Full name is required';
    if (!form.age) e.age = 'Age is required';
    else if (isPrimary && Number(form.age) < 18) e.age = 'Primary passenger must be 18+';
    if (isPrimary && !form.email?.trim()) e.email = 'Email is required';
    if (isPrimary && !form.phone?.trim()) e.phone = 'Phone is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave(form);
  };

  const Field = ({ label, fkey, keyboardType = 'default', required }) => (
    <View style={ss.fieldWrap}>
      <Text style={[ss.label, { color: tc.subheading }]}>
        {label}{required ? ' *' : ''}
      </Text>
      <TextInput
        style={[ss.inp, { backgroundColor: tc.background, borderColor: errors[fkey] ? '#EF4444' : tc.border || '#E5E5EA', color: tc.heading }]}
        value={form[fkey] || ''}
        onChangeText={v => set(fkey, v)}
        keyboardType={keyboardType}
        placeholderTextColor={tc.subtext}
        placeholder={label}
      />
      {!!errors[fkey] && <Text style={ss.err}>{errors[fkey]}</Text>}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={ss.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
          <View style={[ss.sheet, { backgroundColor: tc.card }]}>
            <View style={[ss.handle, { backgroundColor: tc.border || '#E5E5EA' }]} />
            <View style={ss.sheetHeader}>
              <Text style={[ss.title, { color: tc.heading }]}>
                {index === 0 ? 'Edit Primary Passenger' : `Edit Passenger ${index + 1}`}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={22} color={tc.subheading} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ss.body}>
              {/* Title picker */}
              <Text style={[ss.label, { color: tc.subheading }]}>Title</Text>
              <View style={ss.titleRow}>
                {PASSENGER_TITLES.map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[ss.titleBtn, { borderColor: form.title === t ? tc.primary : tc.border || '#E5E5EA', backgroundColor: form.title === t ? `${tc.primary}18` : tc.background }]}
                    onPress={() => set('title', t)}
                  >
                    <Text style={[ss.titleBtnText, { color: form.title === t ? tc.primary : tc.subheading }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Field label="Full Name" fkey="fullName" required />
              <Field label="Age" fkey="age" keyboardType="numeric" required />

              {/* Gender */}
              <Text style={[ss.label, { color: tc.subheading }]}>Gender</Text>
              <View style={ss.genderRow}>
                {['Male', 'Female'].map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[ss.genderBtn, { borderColor: form.gender === g ? tc.primary : tc.border || '#E5E5EA', backgroundColor: form.gender === g ? `${tc.primary}18` : tc.background }]}
                    onPress={() => set('gender', g)}
                  >
                    <Ionicons name={g === 'Male' ? 'male' : 'female'} size={14} color={form.gender === g ? tc.primary : tc.subheading} />
                    <Text style={[ss.genderText, { color: form.gender === g ? tc.primary : tc.subheading }]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Field label="Email" fkey="email" keyboardType="email-address" required={isPrimary} />
              <Field label="Phone Number" fkey="phone" keyboardType="phone-pad" required={isPrimary} />
            </ScrollView>

            <View style={ss.footer}>
              <TouchableOpacity style={[ss.saveBtn, { backgroundColor: tc.primary }]} onPress={handleSave} activeOpacity={0.85}>
                <Text style={ss.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const ss = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  handle:     { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  sheetHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  title:      { fontSize: 16, fontWeight: '700' },
  body:       { paddingHorizontal: 20, paddingBottom: 16 },
  fieldWrap:  { marginBottom: 14 },
  label:      { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inp:        { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  err:        { color: '#EF4444', fontSize: 12, marginTop: 4 },
  titleRow:   { flexDirection: 'row', gap: 8, marginBottom: 14 },
  titleBtn:   { flex: 1, borderWidth: 1.5, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  titleBtnText:{ fontSize: 13, fontWeight: '600' },
  genderRow:  { flexDirection: 'row', gap: 10, marginBottom: 14 },
  genderBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10 },
  genderText: { fontSize: 14, fontWeight: '600' },
  footer:     { padding: 16, paddingBottom: 24 },
  saveBtn:    { paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  saveBtnText:{ color: '#FFF', fontSize: 15, fontWeight: '700' },
});
