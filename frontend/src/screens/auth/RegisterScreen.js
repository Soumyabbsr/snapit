import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Refs ─────────────────────────────────────────────────
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // ── Per-field validation ───────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!name.trim() || name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters.';
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Enter a valid email address.';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    return newErrors;
  };

  const handleRegister = async () => {
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const result = await register(name.trim(), email.trim().toLowerCase(), password);
    setLoading(false);

    if (!result.success) {
      setErrors({ general: result.error || 'Registration failed. Please try again.' });
    } else {
      // After registration, guide new user through profile setup
      navigation.navigate('ProfileSetup');
    }
  };

  const renderInput = (label, value, setter, key, options = {}) => (
    <View style={styles.inputGroup} key={key}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={options.ref}
        style={[styles.input, errors[key] && styles.inputError]}
        value={value}
        onChangeText={(text) => { setter(text); setErrors((e) => ({ ...e, [key]: undefined })); }}
        placeholderTextColor="#555"
        {...options}
      />
      {errors[key] ? <Text style={styles.fieldError}>{errors[key]}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.appName}>Create Account</Text>
          <Text style={styles.subtitle}>Join SnapIt and start sharing</Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.form}>
          {errors.general ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          ) : null}

          {renderInput('Full Name', name, setName, 'name', {
            placeholder: 'John Doe',
            autoCapitalize: 'words',
            returnKeyType: 'next',
            onSubmitEditing: () => emailRef.current?.focus(),
            blurOnSubmit: false,
          })}

          {renderInput('Email', email, setEmail, 'email', {
            ref: emailRef,
            placeholder: 'you@example.com',
            keyboardType: 'email-address',
            autoCapitalize: 'none',
            autoCorrect: false,
            returnKeyType: 'next',
            onSubmitEditing: () => passwordRef.current?.focus(),
            blurOnSubmit: false,
          })}

          {/* Password with show/hide */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                ref={passwordRef}
                style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                value={password}
                onChangeText={(text) => { setPassword(text); setErrors((e) => ({ ...e, password: undefined })); }}
                placeholder="Min. 6 characters"
                placeholderTextColor="#555"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
          </View>

          {renderInput('Confirm Password', confirmPassword, setConfirmPassword, 'confirmPassword', {
            ref: confirmPasswordRef,
            placeholder: 'Repeat password',
            secureTextEntry: !showPassword,
            autoCapitalize: 'none',
            returnKeyType: 'done',
            onSubmitEditing: handleRegister,
          })}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 32 },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  form: { width: '100%' },
  errorBox: {
    backgroundColor: 'rgba(255,59,48,0.15)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  errorText: { color: '#FF6B6B', fontSize: 13 },
  inputGroup: { marginBottom: 14 },
  label: { color: '#aaa', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  inputError: { borderColor: '#FF3B30' },
  fieldError: { color: '#FF6B6B', fontSize: 12, marginTop: 4 },
  passwordContainer: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eyeButton: {
    position: 'absolute',
    right: 14, top: 0, bottom: 0,
    justifyContent: 'center',
  },
  eyeText: { fontSize: 18 },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#666', fontSize: 14 },
  linkText: { color: '#FF6B35', fontSize: 14, fontWeight: '700' },
});

export default RegisterScreen;
