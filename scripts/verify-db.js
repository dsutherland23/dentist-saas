
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifyConnection() {
    console.log('Testing Supabase Connection...');
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    try {
        const { data, error } = await supabase.from('clinics').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('Connection Failed:', error.message);
            process.exit(1);
        } else {
            console.log('Connection Successful!');
            console.log('Clinics table accessible. Row count:', data); // data is null for head:true with count, count property holds the value
            process.exit(0);
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
        process.exit(1);
    }
}

verifyConnection();
