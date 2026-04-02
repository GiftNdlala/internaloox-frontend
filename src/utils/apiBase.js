const DEFAULT_API_BASE = 'https://internaloox-backend.onrender.com/api';

export const normalizeApiBase = (rawBase, fallback = DEFAULT_API_BASE) => {
  const base = String(rawBase || fallback).replace(/\/+$/, '');
  return /\/api$/i.test(base) ? base : `${base}/api`;
};

export const API_BASE = normalizeApiBase(
  (typeof window !== 'undefined' && window.OOX_API_BASE) || process.env.REACT_APP_API_BASE,
);
