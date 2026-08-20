const supabase = require('./supabase');

const connectDB = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.warn('Supabase connection check warning:', error.message);
    }
    console.log('Supabase connected successfully');
  } catch (error) {
    console.error(`Supabase connection error: ${error.message}`);
  }
};

module.exports = connectDB;
