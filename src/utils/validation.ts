// Validation utility with regex patterns

interface Validator {
  regex: RegExp;
  message: string;
  test: (value: string) => boolean;
}

export const validators: Record<string, Validator> = {
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
    test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  },

  phone: {
    regex: /^(\+20|0)?1[0125]\d{8}$/,
    message: 'Please enter a valid Egyptian phone (e.g., 01012345678)',
    test: (value: string) => /^(\+20|0)?1[0125]\d{8}$/.test(value)
  },

  password: {
    regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    message: 'Password must be 8+ characters with uppercase, lowercase, number and special character (@$!%*?&)',
    test: (value: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value)
  },

  name: {
    regex: /^[a-zA-Z\s]{2,50}$/,
    message: 'Name must be 2-50 characters (letters only)',
    test: (value: string) => /^[a-zA-Z\s]{2,50}$/.test(value)
  },

  companyName: {
    regex: /^[a-zA-Z0-9\s&.-]{3,100}$/,
    message: 'Company name must be 3-100 characters',
    test: (value: string) => /^[a-zA-Z0-9\s&.-]{3,100}$/.test(value)
  },

  serialNumber: {
    regex: /^[A-Z0-9-]{3,20}$/,
    message: 'Serial number must be 3-20 characters (uppercase, numbers, hyphens)',
    test: (value: string) => /^[A-Z0-9-]{3,20}$/.test(value)
  }
};

export const validate = (fieldName: string, value: string, required: boolean = true): string => {
  const validator = validators[fieldName];

  // Check if required field is empty
  if (required && (!value || !value.trim())) {
    return 'This field is required';
  }

  // If not required and empty, no error
  if (!required && (!value || !value.trim())) {
    return '';
  }

  // If no validator defined, no error
  if (!validator) return '';

  // Test against regex
  if (!validator.test(value)) {
    return validator.message;
  }

  return '';
};

export const validatePassword = (password: string): string => {
  if (!password) {
    return 'Password is required';
  }
  if (!validators.password.test(password)) {
    return validators.password.message;
  }
  return '';
};

export const validateConfirmPassword = (newPassword: string, confirmPassword: string): string => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  if (newPassword !== confirmPassword) {
    return 'Passwords do not match';
  }
  return '';
};

export const validateEmail = (email: string): string => {
  if (!email || !email.trim()) {
    return 'Email is required';
  }
  if (!validators.email.test(email)) {
    return validators.email.message;
  }
  return '';
};

export const validatePhone = (phone: string): string => {
  if (!phone || !phone.trim()) {
    return 'Phone number is required';
  }
  if (!validators.phone.test(phone)) {
    return validators.phone.message;
  }
  return '';
};

export const validateName = (name: string): string => {
  if (!name || !name.trim()) {
    return 'Name is required';
  }
  if (!validators.name.test(name)) {
    return validators.name.message;
  }
  return '';
};

export const validateCompanyName = (companyName: string): string => {
  if (!companyName || !companyName.trim()) {
    return 'Company name is required';
  }
  if (!validators.companyName.test(companyName)) {
    return validators.companyName.message;
  }
  return '';
};

export default validators;
