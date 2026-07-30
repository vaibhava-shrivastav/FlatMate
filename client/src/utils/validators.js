export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPassword = (password) => password.length >= 8;

export const isRequired = (value) => value !== null && value !== undefined && value !== '';
