import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
  TextInput, Switch, ActivityIndicator, Modal, FlatList, Image, Alert, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThem } from 'constants/useTheme';
import { colors } from 'constants/colors';
import { StatusBarComponent } from 'component/StatusBar';
import { useWallet } from 'context/WalletContext';
import { formatCurrency } from 'CONSTANT/formatCurrency';
import { cacCheckCompliance, cacValidatePayload, cacRegisterBusinessName } from 'AuthFunction/paymentService';
import { LINE_OF_BUSINESS, PROHIBITED_WORDS, NIGERIAN_STATES, COMPLIANCE_MESSAGES, CAC_PRICING } from 'constants/cacConstants';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const findProhibited = (name) => {
  if (!name) return null;
  const words = name.toLowerCase().trim().split(/\s+/);
  for (const pw of PROHIBITED_WORDS) if (words.includes(pw.toLowerCase())) return pw;
  return null;
};
const isSingleWord = (n) => !n || n.trim().split(/\s+/).length < 2;
const toYMD = (d) => { if (!d) return ''; const dt = typeof d === 'string' ? new Date(d) : d; return dt.toISOString().split('T')[0]; };
const getAge = (dob) => { if (!dob) return 0; return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)); };

// ─── Atoms ────────────────────────────────────────────────────────────────────
const F = ({ label, required, error, children }) => (
  <View style={st.field}>
    <Text style={st.fl}>{label}{required ? ' *' : ''}</Text>
    {children}
    {error ? <Text style={st.fe}>{error}</Text> : null}
  </View>
);

const Txt = ({ value, onChangeText, placeholder, keyboardType, editable = true, multiline, tc }) => (
  <TextInput
    style={[st.inp, { backgroundColor: tc.card, color: tc.heading, borderColor: tc.border || '#E5E5EA' }, multiline && { height: 80, textAlignVertical: 'top' }]}
    value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={tc.subtext}
    keyboardType={keyboardType || 'default'} editable={editable} multiline={multiline}
    autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'} />
);

const Pick = ({ value, options, placeholder, onSelect, tc }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={[st.inp, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', flexDirection: 'row', alignItems: 'center' }]} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={[{ flex: 1, fontSize: 15 }, { color: value ? tc.heading : tc.subtext }]}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={tc.subtext} />
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" transparent>
        <TouchableOpacity style={st.ov} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={[st.sh, { backgroundColor: tc.card }]}>
            <Text style={[st.shT, { color: tc.heading }]}>{placeholder}</Text>
            <FlatList data={options} keyExtractor={i => i} renderItem={({ item }) => (
              <TouchableOpacity style={[st.shR, { borderBottomColor: tc.border || '#F0F0F0' }, item === value && { backgroundColor: `${tc.primary}10` }]} onPress={() => { onSelect(item); setOpen(false); }}>
                <Text style={[{ fontSize: 15 }, { color: tc.heading }, item === value && { color: tc.primary, fontWeight: '700' }]}>{item}</Text>
                {item === value && <Ionicons name="checkmark" size={18} color={tc.primary} />}
              </TouchableOpacity>
            )} />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const DP = ({ value, onChange, tc, maxDate, minDate }) => {
  const [show, setShow] = useState(false);
  const parsed = value ? new Date(value) : (maxDate || new Date());
  return (
    <>
      <TouchableOpacity style={[st.inp, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', flexDirection: 'row', alignItems: 'center' }]} onPress={() => setShow(true)} activeOpacity={0.8}>
        <Text style={[{ flex: 1, fontSize: 15 }, { color: value ? tc.heading : tc.subtext }]}>{value || 'Select date'}</Text>
        <Ionicons name="calendar-outline" size={18} color={tc.subtext} />
      </TouchableOpacity>
      {show && (
        <DateTimePicker value={parsed} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} maximumDate={maxDate} minimumDate={minDate}
          onChange={(_, dt) => { setShow(Platform.OS === 'ios'); if (dt) onChange(toYMD(dt)); }} />
      )}
    </>
  );
};

const NameFld = ({ label, value, onChange, lob, onStatus, tc, onChip }) => {
  const [status, setStatus] = useState(null);
  const [busy,   setBusy]   = useState(false);
  const [cerr,   setCerr]   = useState('');
  const t = useRef(null);

  useEffect(() => {
    clearTimeout(t.current);
    setStatus(null); setCerr('');
    if (!value?.trim()) { onStatus(null); return; }
    if (isSingleWord(value)) { setCerr('Name must be more than one word'); onStatus({ code: 'client_err' }); return; }
    const pw = findProhibited(value);
    if (pw) { setCerr(`Contains prohibited word: "${pw}"`); onStatus({ code: 'client_err' }); return; }
    setBusy(true);
    t.current = setTimeout(async () => {
      try {
        const res  = await cacCheckCompliance(value.trim(), lob || '');
        const d    = res?.data || res;
        const code = String(d?.statusCode ?? d?.data?.statusCode ?? '');
        const r    = { code, data: d };
        setStatus(r); onStatus(r);
      } catch { setStatus({ code: 'error' }); onStatus({ code: 'error' }); }
      finally { setBusy(false); }
    }, 800);
    return () => clearTimeout(t.current);
  }, [value, lob]);

  const msg   = COMPLIANCE_MESSAGES[status?.code];
  const chips = status?.data?.recommendedActions?.keywords || status?.data?.suggestedNames || status?.data?.similarNames || [];

  return (
    <View style={st.field}>
      <Text style={st.fl}>{label} *</Text>
      <View style={[st.inp, { backgroundColor: tc.card, borderColor: tc.border || '#E5E5EA', flexDirection: 'row', alignItems: 'center' }]}>
        <TextInput style={[{ flex: 1, fontSize: 15, color: tc.heading }]} value={value} onChangeText={onChange} placeholder="e.g. Emeka Ventures" placeholderTextColor={tc.subtext} autoCapitalize="words" />
        {busy && <ActivityIndicator size="small" color={tc.primary} />}
        {!busy && status?.code === '00' && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
      </View>
      {cerr ? <Text style={st.fe}>{cerr}</Text> : null}
      {!cerr && msg && <View style={[st.cr, { backgroundColor: `${msg.color}15` }]}><Text style={[st.ct, { color: msg.color }]}>{msg.label}</Text></View>}
      {chips.length > 0 && (
        <View style={st.chipRow}>
          {chips.slice(0, 6).map((c, i) => (
            <TouchableOpacity key={i} style={[st.chip, { backgroundColor: `${tc.primary}12`, borderColor: tc.primary }]} onPress={() => onChip?.(String(c))}>
              <Text style={[st.chipT, { color: tc.primary }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {(status?.code === '03' || status?.code === '04') && (
        <View style={[st.warn, { backgroundColor: '#FF980018' }]}>
          <Ionicons name="warning-outline" size={13} color="#FF9800" />
          <Text style={{ fontSize: 12, color: '#FF9800', flex: 1 }}>You must attach a supporting document in Step 4.</Text>
        </View>
      )}
    </View>
  );
};

const ImgSlot = ({ label, required, value, onPick, tc }) => {
  const [err, setErr] = useState('');
  const pick = async () => {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (p.status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access.'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, base64: true, allowsEditing: true });
    if (r.canceled) return;
    const a = r.assets[0];
    const kb = a.fileSize ? a.fileSize / 1024 : (a.base64?.length * 0.75) / 1024;
    if (kb > 1024) { setErr('File too large — max 1MB'); return; }
    setErr(''); onPick(`data:image/jpeg;base64,${a.base64}`, Math.round(kb));
  };
  return (
    <View>
      <Text style={[st.fl, { color: tc.heading }]}>{label}{required ? ' *' : ' (Optional)'}</Text>
      <TouchableOpacity style={[st.imgP, { backgroundColor: tc.card, borderColor: value ? tc.primary : tc.border || '#E5E5EA', borderWidth: value ? 2 : 1 }]} onPress={pick} activeOpacity={0.8}>
        {value ? <Image source={{ uri: value }} style={st.imgT} /> : <View style={{ alignItems: 'center', gap: 6 }}><Ionicons name="cloud-upload-outline" size={28} color={tc.subtext} /><Text style={{ fontSize: 12, color: tc.subtext }}>Tap to upload</Text></View>}
      </TouchableOpacity>
      {err ? <Text style={st.fe}>{err}</Text> : null}
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
const LABELS = ['Business Details', 'Proprietor', 'Business Address', 'Documents', 'Review & Submit'];
const E0 = {
  proposedOption1:'',proposedOption2:'',lineOfBusiness:'',businessCommencementDate:'',priorityService:false,requiresSupportingDoc:false,
  proprietorFirstname:'',proprietorOthername:'',proprietorSurname:'',proprietorGender:'',proprietorDob:'',proprietorNationality:'Nigerian',
  proprietorPhonenumber:'',proprietorEmail:'',proprietorStreetNumber:'',proprietorServiceAddress:'',proprietorCity:'',proprietorState:'',proprietorLga:'',proprietorPostcode:'',
  companyEmail:'',companyStreetNumber:'',companyAddress:'',companyCity:'',companyState:'',
  passport:null,meansOfId:null,signature:null,supportingDoc:null,
  passportKB:0,meansOfIdKB:0,signatureKB:0,supportingDocKB:0,
};

export default function CACScreen({ navigation }) {
  const dark = useThem(), tc = dark ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  const { wallet } = useWallet();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ...E0 });
  const [pin,  setPin]  = useState('');
  const [busy, setBusy] = useState(false);
  const [n1,   setN1]   = useState(null);
  const [n2,   setN2]   = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fee = form.priorityService ? CAC_PRICING.priority : CAC_PRICING.standard;
  const bal = wallet?.user?.walletBalance || 0;
  const broke = bal < fee;

  const ok1 = () => { const v = s => s?.code==='00'||s?.code==='03'||s?.code==='04'; return v(n1)&&v(n2)&&!!form.lineOfBusiness&&!!form.businessCommencementDate; };
  const ok2 = () => !!(form.proprietorFirstname&&form.proprietorSurname&&form.proprietorGender&&form.proprietorDob&&getAge(form.proprietorDob)>=18&&form.proprietorPhonenumber&&form.proprietorEmail&&form.proprietorStreetNumber&&form.proprietorServiceAddress&&form.proprietorCity&&form.proprietorState&&form.proprietorLga&&form.proprietorPostcode);
  const ok3 = () => !!(form.companyEmail&&form.companyStreetNumber&&form.companyAddress&&form.companyCity&&form.companyState);
  const ok4 = () => !!(form.passport&&form.meansOfId&&form.signature&&(!form.requiresSupportingDoc||form.supportingDoc));
  const checks = [ok1,ok2,ok3,ok4,()=>true];

  const submit = async () => {
    if (pin.length!==4){Alert.alert('PIN required','Enter your 4-digit transaction PIN.');return;}
    setBusy(true);
    try {
      const v=await cacValidatePayload({...form});
      if(!v?.success){Alert.alert('Validation Failed',v?.message||'Check your details.');return;}
      const r=await cacRegisterBusinessName(pin,form);
      if(!r?.success){Alert.alert('Submission Failed',r?.message||'Try again.');return;}
      navigation.navigate('CACStatus',{transactionRef:r.data?.transactionRef||r.transactionRef,businessName:form.proposedOption1});
    }catch(e){Alert.alert('Error',e.message||'Something went wrong.');}
    finally{setBusy(false);}
  };

  const Bar=()=>(
    <View style={st.bar}>
      {[1,2,3,4,5].map(n=>{
        const d=n<step,a=n===step;
        return(<React.Fragment key={n}>
          <View style={[st.dot,d&&{backgroundColor:tc.primary},a&&{backgroundColor:tc.primary},!d&&!a&&{backgroundColor:tc.card,borderWidth:1.5,borderColor:tc.border||'#E5E5EA'}]}>
            {d?<Ionicons name="checkmark" size={11} color="#FFF"/>:<Text style={[{fontSize:11,fontWeight:'700'},{color:a?'#FFF':tc.subtext}]}>{n}</Text>}
          </View>
          {n<5&&<View style={[st.ln,{backgroundColor:n<step?tc.primary:tc.border||'#E5E5EA'}]}/>}
        </React.Fragment>);
      })}
    </View>
  );

  const S1=()=>(
    <ScrollView contentContainerStyle={st.sc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <NameFld label="Desired Business Name" value={form.proposedOption1} onChange={v=>set('proposedOption1',v)} lob={form.lineOfBusiness} onStatus={n=>{setN1(n);if(n?.code==='03'||n?.code==='04')set('requiresSupportingDoc',true);}} tc={tc} onChip={v=>set('proposedOption2',v)}/>
      <NameFld label="Alternative Business Name" value={form.proposedOption2} onChange={v=>set('proposedOption2',v)} lob={form.lineOfBusiness} onStatus={n=>{setN2(n);if(n?.code==='03'||n?.code==='04')set('requiresSupportingDoc',true);}} tc={tc} onChip={v=>set('proposedOption1',v)}/>
      <F label="Line of Business" required><Pick value={form.lineOfBusiness} options={LINE_OF_BUSINESS} placeholder="Select line of business" onSelect={v=>set('lineOfBusiness',v)} tc={tc}/></F>
      <F label="Business Commencement Date" required><DP value={form.businessCommencementDate} onChange={v=>set('businessCommencementDate',v)} tc={tc} maxDate={new Date()}/></F>
      <F label="Service Type" required>
        <View style={[st.inp,{backgroundColor:tc.card,borderColor:tc.border||'#E5E5EA',flexDirection:'row',alignItems:'center'}]}>
          <View style={{flex:1}}>
            <Text style={{fontSize:15,fontWeight:'600',color:tc.heading}}>{form.priorityService?`Priority — ${formatCurrency(CAC_PRICING.priority,'NGN')}`:`Standard — ${formatCurrency(CAC_PRICING.standard,'NGN')}`}</Text>
            <Text style={{fontSize:12,color:tc.subheading,marginTop:2}}>{form.priorityService?'Faster automated approval':'Standard processing time'}</Text>
          </View>
          <Switch value={form.priorityService} onValueChange={v=>set('priorityService',v)} trackColor={{false:'#D0D0D0',true:`${tc.primary}80`}} thumbColor={form.priorityService?tc.primary:'#F4F4F4'}/>
        </View>
      </F>
    </ScrollView>
  );

  const S2=()=>(
    <ScrollView contentContainerStyle={st.sc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <F label="First Name" required><Txt value={form.proprietorFirstname} onChangeText={v=>set('proprietorFirstname',v)} placeholder="First name" tc={tc}/></F>
      <F label="Other Name"><Txt value={form.proprietorOthername} onChangeText={v=>set('proprietorOthername',v)} placeholder="Optional" tc={tc}/></F>
      <F label="Surname" required><Txt value={form.proprietorSurname} onChangeText={v=>set('proprietorSurname',v)} placeholder="Surname" tc={tc}/></F>
      <F label="Gender" required>
        <View style={st.rr}>
          {['MALE','FEMALE'].map(g=>(
            <TouchableOpacity key={g} onPress={()=>set('proprietorGender',g)} style={[st.rb,{borderColor:form.proprietorGender===g?tc.primary:tc.border||'#E5E5EA',backgroundColor:form.proprietorGender===g?`${tc.primary}12`:tc.card}]}>
              <Text style={[{fontSize:14,fontWeight:'600'},{color:form.proprietorGender===g?tc.primary:tc.subheading}]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </F>
      <F label="Date of Birth" required error={form.proprietorDob&&getAge(form.proprietorDob)<18?'Must be at least 18 years old':''}>
        <DP value={form.proprietorDob} onChange={v=>set('proprietorDob',v)} tc={tc} maxDate={new Date(Date.now()-18*365.25*24*3600*1000)}/>
      </F>
      <F label="Nationality" required><Txt value="Nigerian" editable={false} tc={tc}/></F>
      <F label="Phone Number" required><Txt value={form.proprietorPhonenumber} onChangeText={v=>set('proprietorPhonenumber',v.replace(/\D/g,''))} placeholder="08012345678" keyboardType="number-pad" tc={tc}/></F>
      <F label="Email" required><Txt value={form.proprietorEmail} onChangeText={v=>set('proprietorEmail',v)} placeholder="email@example.com" keyboardType="email-address" tc={tc}/></F>
      <F label="Street Number" required><Txt value={form.proprietorStreetNumber} onChangeText={v=>set('proprietorStreetNumber',v)} placeholder="e.g. 41" tc={tc}/></F>
      <F label="Service Address" required><Txt value={form.proprietorServiceAddress} onChangeText={v=>set('proprietorServiceAddress',v)} placeholder="Full address" multiline tc={tc}/></F>
      <F label="City" required><Txt value={form.proprietorCity} onChangeText={v=>set('proprietorCity',v)} placeholder="City" tc={tc}/></F>
      <F label="State" required><Pick value={form.proprietorState} options={NIGERIAN_STATES} placeholder="Select state" onSelect={v=>set('proprietorState',v)} tc={tc}/></F>
      <F label="LGA" required><Txt value={form.proprietorLga} onChangeText={v=>set('proprietorLga',v)} placeholder="Local Government Area" tc={tc}/></F>
      <F label="Postcode" required><Txt value={form.proprietorPostcode} onChangeText={v=>set('proprietorPostcode',v)} placeholder="Postcode" keyboardType="number-pad" tc={tc}/></F>
    </ScrollView>
  );

  const S3=()=>(
    <ScrollView contentContainerStyle={st.sc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <F label="Company Email" required><Txt value={form.companyEmail} onChangeText={v=>set('companyEmail',v)} placeholder="company@example.com" keyboardType="email-address" tc={tc}/></F>
      <F label="Street Number" required><Txt value={form.companyStreetNumber} onChangeText={v=>set('companyStreetNumber',v)} placeholder="e.g. 12" tc={tc}/></F>
      <F label="Company Address" required><Txt value={form.companyAddress} onChangeText={v=>set('companyAddress',v)} placeholder="Full business address" multiline tc={tc}/></F>
      <F label="City" required><Txt value={form.companyCity} onChangeText={v=>set('companyCity',v)} placeholder="City" tc={tc}/></F>
      <F label="State" required><Pick value={form.companyState} options={NIGERIAN_STATES} placeholder="Select state" onSelect={v=>set('companyState',v)} tc={tc}/></F>
    </ScrollView>
  );

  const S4=()=>(
    <ScrollView contentContainerStyle={st.sc} showsVerticalScrollIndicator={false}>
      <Text style={[{fontSize:13,marginBottom:14},{color:tc.subheading}]}>Upload clear images. Max 1MB each. PNG or JPEG only.</Text>
      <View style={st.ig}>
        {[{k:'passport',kb:'passportKB',l:'Passport Photo',r:true},{k:'meansOfId',kb:'meansOfIdKB',l:'Means of ID',r:true},{k:'signature',kb:'signatureKB',l:'Signature',r:true},{k:'supportingDoc',kb:'supportingDocKB',l:'Supporting Doc',r:form.requiresSupportingDoc}].map(({k,kb,l,r})=>(
          <View key={k} style={st.igw}>
            <ImgSlot label={l} required={r} value={form[k]} onPick={(b,sz)=>{set(k,b);set(kb,sz);}} tc={tc}/>
            {form[kb]>0&&<Text style={[{fontSize:11,textAlign:'center',marginTop:2},{color:tc.subtext}]}>{form[kb]} KB</Text>}
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const S5=()=>{
    const rows=[['Business Name',form.proposedOption1],['Alternative',form.proposedOption2],['Line of Business',form.lineOfBusiness],['Commencement',form.businessCommencementDate],['Service Type',form.priorityService?'Priority':'Standard'],['Proprietor',`${form.proprietorFirstname} ${form.proprietorOthername||''} ${form.proprietorSurname}`.trim()],['Gender / DOB',`${form.proprietorGender} / ${form.proprietorDob}`],['Phone / Email',`${form.proprietorPhonenumber} / ${form.proprietorEmail}`],['Prop. Address',`${form.proprietorStreetNumber}, ${form.proprietorServiceAddress}, ${form.proprietorCity}, ${form.proprietorState}`],['LGA / Postcode',`${form.proprietorLga} / ${form.proprietorPostcode}`],['Company Email',form.companyEmail],['Biz. Address',`${form.companyStreetNumber}, ${form.companyAddress}, ${form.companyCity}, ${form.companyState}`]];
    const docs=[['Passport',form.passport],['ID',form.meansOfId],['Signature',form.signature],['Support',form.supportingDoc]];
    return(
      <ScrollView contentContainerStyle={st.sc} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[st.sCard,{backgroundColor:tc.card,borderColor:tc.border||'#E5E5EA'}]}>
          {rows.filter(([,v])=>v).map(([l,v])=>(
            <View key={l} style={[st.sRow,{borderBottomColor:tc.border||'#F0F0F0'}]}>
              <Text style={[st.sL,{color:tc.subheading}]}>{l}</Text>
              <Text style={[st.sV,{color:tc.heading}]} numberOfLines={2}>{v}</Text>
            </View>
          ))}
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:10,paddingTop:12}}>
            {docs.map(([l,v])=>(
              <View key={l} style={{flexDirection:'row',alignItems:'center',gap:4}}>
                <Ionicons name={v?'checkmark-circle':'ellipse-outline'} size={15} color={v?'#4CAF50':tc.subtext}/>
                <Text style={{fontSize:12,color:v?'#4CAF50':tc.subtext}}>{l}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[st.fCard,{backgroundColor:tc.card,borderColor:tc.border||'#E5E5EA'}]}>
          <View style={st.fRow}><Text style={[{fontSize:14},{color:tc.subheading}]}>Registration Fee</Text><Text style={[{fontSize:16,fontWeight:'800'},{color:tc.primary}]}>{formatCurrency(fee,'NGN')}</Text></View>
          <View style={st.fRow}><Text style={[{fontSize:14},{color:tc.subheading}]}>Wallet Balance</Text><Text style={[{fontSize:16,fontWeight:'800'},{color:broke?'#EF4444':'#4CAF50'}]}>{formatCurrency(bal,'NGN')}</Text></View>
          {broke&&<View style={{flexDirection:'row',alignItems:'flex-start',gap:6,marginTop:4}}><Ionicons name="warning-outline" size={14} color="#EF4444"/><Text style={{fontSize:12,color:'#EF4444',flex:1}}>Insufficient balance. Please fund your wallet first.</Text></View>}
        </View>
        {!broke&&(
          <View style={[st.pCard,{backgroundColor:tc.card,borderColor:tc.border||'#E5E5EA'}]}>
            <Text style={[st.fl,{color:tc.heading}]}>Transaction PIN</Text>
            <TextInput style={[st.inp,{backgroundColor:tc.background,color:tc.heading,borderColor:tc.border||'#E5E5EA',letterSpacing:8,textAlign:'center'}]} value={pin} onChangeText={setPin} placeholder="••••" placeholderTextColor={tc.subtext} keyboardType="number-pad" secureTextEntry maxLength={4}/>
          </View>
        )}
        <TouchableOpacity style={[st.subBtn,{backgroundColor:tc.primary,opacity:(broke||busy||pin.length!==4)?0.5:1}]} onPress={submit} disabled={broke||busy||pin.length!==4} activeOpacity={0.85}>
          {busy?<ActivityIndicator color="#FFF"/>:<Text style={st.subTxt}>Submit Registration</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const STEPS=[S1,S2,S3,S4,S5];
  const Cur=STEPS[step-1];

  return(
    <SafeAreaView style={[st.container,{backgroundColor:tc.background}]}>
      <StatusBarComponent/>
      <View style={[st.header,{backgroundColor:tc.background,borderBottomColor:tc.border||'#E5E5EA',paddingTop:insets.top+8}]}>
        <TouchableOpacity onPress={()=>step>1?setStep(n=>n-1):navigation.goBack()} hitSlop={{top:10,bottom:10,left:10,right:10}}><Ionicons name="arrow-back" size={24} color={tc.heading}/></TouchableOpacity>
        <View style={{alignItems:'center'}}><Text style={[{fontSize:16,fontWeight:'700'},{color:tc.heading}]}>CAC Registration</Text><Text style={[{fontSize:11,marginTop:1},{color:tc.subheading}]}>{LABELS[step-1]}</Text></View>
        <View style={{width:24}}/>
      </View>
      <Bar/>
      <View style={{flex:1}}><Cur/></View>
      {step<5&&(
        <View style={[st.nav,{backgroundColor:tc.background,borderTopColor:tc.border||'#E5E5EA',paddingBottom:insets.bottom+8}]}>
          <TouchableOpacity style={[st.nxt,{backgroundColor:tc.primary,opacity:checks[step-1]()?1:0.5}]} onPress={()=>checks[step-1]()&&setStep(n=>n+1)} disabled={!checks[step-1]()} activeOpacity={0.85}>
            <Text style={st.nxtT}>Next  →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const st=StyleSheet.create({
  container:{flex:1},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingBottom:12,borderBottomWidth:1},
  bar:{flexDirection:'row',alignItems:'center',paddingHorizontal:20,paddingVertical:14},
  dot:{width:24,height:24,borderRadius:12,alignItems:'center',justifyContent:'center'},
  ln:{flex:1,height:2,marginHorizontal:4},
  sc:{paddingHorizontal:16,paddingTop:8,paddingBottom:120},
  field:{marginBottom:16},
  fl:{fontSize:13,fontWeight:'600',marginBottom:8},
  fe:{fontSize:12,color:'#EF4444',marginTop:4},
  inp:{borderWidth:1,borderRadius:12,paddingHorizontal:14,paddingVertical:13,fontSize:15},
  cr:{flexDirection:'row',alignItems:'center',padding:10,borderRadius:8,marginTop:6},
  ct:{fontSize:12,fontWeight:'600',flex:1},
  warn:{flexDirection:'row',alignItems:'center',gap:6,padding:8,borderRadius:8,marginTop:4},
  chipRow:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:6},
  chip:{paddingHorizontal:12,paddingVertical:5,borderRadius:20,borderWidth:1},
  chipT:{fontSize:12,fontWeight:'600'},
  rr:{flexDirection:'row',gap:12},
  rb:{flex:1,paddingVertical:13,borderRadius:12,borderWidth:1.5,alignItems:'center'},
  ov:{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'flex-end'},
  sh:{borderTopLeftRadius:20,borderTopRightRadius:20,maxHeight:'70%',paddingTop:16},
  shT:{fontSize:16,fontWeight:'700',paddingHorizontal:20,paddingBottom:12},
  shR:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingVertical:14,borderBottomWidth:StyleSheet.hairlineWidth},
  ig:{flexDirection:'row',flexWrap:'wrap',gap:12},
  igw:{width:'47%'},
  imgP:{height:120,borderRadius:12,borderStyle:'dashed',alignItems:'center',justifyContent:'center'},
  imgT:{width:'100%',height:'100%',borderRadius:12},
  sCard:{borderRadius:14,borderWidth:1,padding:16,marginBottom:14},
  sRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:9,borderBottomWidth:StyleSheet.hairlineWidth},
  sL:{fontSize:13,flex:1},
  sV:{fontSize:13,fontWeight:'600',flex:1.5,textAlign:'right'},
  fCard:{borderRadius:14,borderWidth:1,padding:16,marginBottom:14},
  fRow:{flexDirection:'row',justifyContent:'space-between',marginBottom:8},
  pCard:{borderRadius:14,borderWidth:1,padding:16,marginBottom:14},
  subBtn:{paddingVertical:16,borderRadius:14,alignItems:'center',marginBottom:8},
  subTxt:{color:'#FFF',fontSize:16,fontWeight:'700'},
  nav:{paddingHorizontal:16,paddingTop:12,borderTopWidth:1},
  nxt:{paddingVertical:15,borderRadius:14,alignItems:'center'},
  nxtT:{color:'#FFF',fontSize:16,fontWeight:'700'},
});
