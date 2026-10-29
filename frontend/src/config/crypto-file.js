import CryptoJS from "crypto-js";

// Access secret key from environment variable
const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;

// Function to encrypt data
export const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

// Function to decrypt data
export const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error("Error decrypting data", error);
    return null;
  }
};

// Save encrypted data in localStorage
export const saveToLocalStorage = (key, data) => {
  const encryptedData = encryptData(data);
  localStorage.setItem(key, encryptedData);
};
// Save encrypted data in localStorage
export const saveToSessionStorage = (key, data) => {
  const encryptedData = encryptData(data);
  sessionStorage.setItem(key, encryptedData);
};

// Get decrypted data from localStorage
export const getFromLocalStorage = (key) => {
  const encryptedData = localStorage.getItem(key);
  if (encryptedData) {
    return decryptData(encryptedData);
  }
  return null;
};
export const getFromSessionStorage = (key) => {
  const encryptedData = sessionStorage.getItem(key);
  if (encryptedData) {
    return decryptData(encryptedData);
  }
  return null;
};
