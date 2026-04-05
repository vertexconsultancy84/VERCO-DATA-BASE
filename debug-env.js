console.log('=== NEXT.JS ENVIRONMENT DEBUG ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);

if (process.env.DATABASE_URL) {
  console.log('DB URL (first 50 chars):', process.env.DATABASE_URL.substring(0, 50));
  console.log('DB URL length:', process.env.DATABASE_URL.length);
} else {
  console.log('❌ DATABASE_URL is not set in Next.js environment');
}

console.log('=== ENVIRONMENT DEBUG COMPLETE ===');
