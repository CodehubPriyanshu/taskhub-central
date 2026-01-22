import { GeneratedCredentials } from '@/types';

// Generate a random password with specified length
const generatePassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  // Ensure at least one of each type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Generate email from name
const generateEmail = (name: string, domain: string = 'company.com'): string => {
  const cleanName = name.toLowerCase().trim();
  const parts = cleanName.split(/\s+/);
  
  if (parts.length >= 2) {
    // First name + last name initial
    return `${parts[0]}.${parts[parts.length - 1]}@${domain}`;
  }
  
  return `${parts[0]}@${domain}`;
};

// Generate unique email by adding number if needed
export const generateUniqueEmail = (
  name: string, 
  existingEmails: string[], 
  domain: string = 'company.com'
): string => {
  let baseEmail = generateEmail(name, domain);
  let email = baseEmail;
  let counter = 1;
  
  while (existingEmails.includes(email)) {
    const [localPart, domainPart] = baseEmail.split('@');
    email = `${localPart}${counter}@${domainPart}`;
    counter++;
  }
  
  return email;
};

// Generate credentials for a new user
export const generateCredentials = (
  name: string, 
  existingEmails: string[]
): GeneratedCredentials => {
  return {
    email: generateUniqueEmail(name, existingEmails),
    password: generatePassword(12),
  };
};

// Simple "hash" function for demo purposes (NOT secure - just for simulation)
// In a real app, this would be bcrypt on the server
export const simpleHash = (password: string): string => {
  // This is NOT secure - just for demonstration
  // Real hashing should use bcrypt on a server
  return `hashed_${btoa(password)}`;
};

// Verify password against "hash"
export const verifyPassword = (password: string, hash: string): boolean => {
  // For demo: check if it's our simple hash format
  if (hash.startsWith('hashed_')) {
    return btoa(password) === hash.replace('hashed_', '');
  }
  // Fallback for legacy plain text passwords
  return password === hash;
};
