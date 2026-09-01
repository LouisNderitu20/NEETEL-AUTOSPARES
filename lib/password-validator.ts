
const COMMON_WEAK_PASSWORDS = new Set([
  "123456",
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password123",
  "admin",
  "admin123",
  "admin2026",
  "qwerty",
  "qwerty123",
  "letmein",
  "welcome",
  "welcome123",
  "owner@2026",
  "manager@2026",
  "receptionist@2026",
  "mechanic@2026",
  "cashier@2026",
  "inventory@2026",
  "itadmin@2026",
  "garage2026",
  "neetel2026",
  "neetelautospares",
  "111111",
  "000000",
  "p@ssword",
  "p@ssword123",
  "change123",
  "changeme",
  "secret",
  "master",
]);

export interface PasswordValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateStrongPassword(
  password: string,
  userEmail?: string
): PasswordValidationResult {
  if (!password || password.trim().length === 0) {
    return { isValid: false, error: "Password is required." };
  }

  const clean = password.trim();


  if (clean.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long." };
  }


  const lower = clean.toLowerCase();
  if (COMMON_WEAK_PASSWORDS.has(lower)) {
    return {
      isValid: false,
      error: "This password is too common and easily guessed. Please choose a unique password.",
    };
  }


  if (/^[a-zA-Z]+@202[0-9]$/i.test(clean) || /^password@/i.test(clean)) {
    return {
      isValid: false,
      error: "Predictable pattern passwords (like 'person@2026') are blocked for security.",
    };
  }


  const hasUpper = /[A-Z]/.test(clean);
  const hasLower = /[a-z]/.test(clean);
  const hasNumber = /[0-9]/.test(clean);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(clean);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return {
      isValid: false,
      error:
        "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (e.g. !@#$%).",
    };
  }

  if (userEmail) {
    const emailPrefix = userEmail.split("@")[0].toLowerCase();
    if (emailPrefix.length >= 3 && lower.includes(emailPrefix)) {
      return {
        isValid: false,
        error: "Password cannot contain your email username or personal details.",
      };
    }
  }

  return { isValid: true };
}
