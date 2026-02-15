import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Read .env manually
const envPath = path.join(rootDir, '.env');
let env = {};

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key && rest.length > 0) {
            env[key.trim()] = rest.join('=').trim();
        }
    });
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
// Try Service Key first (for admin rights), then Anon Key
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: Missing VITE_SUPABASE_URL or keys in .env');
    console.log('Make sure you have a .env file with Supabase credentials.');
    process.exit(1);
}

console.log(`Connecting to Supabase at ${SUPABASE_URL}...`);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

async function uploadLogo() {
    const logoPath = path.join(rootDir, 'public', 'logo.png');

    if (!fs.existsSync(logoPath)) {
        console.error('Error: public/logo.png not found!');
        console.log('Please save your logo image as "logo.png" in the "public" folder first.');
        process.exit(1);
    }

    const fileContent = fs.readFileSync(logoPath);

    console.log('Uploading logo.png to assets bucket...');

    const { data, error } = await supabase.storage
        .from('assets')
        .upload('logo.png', fileContent, {
            contentType: 'image/png',
            upsert: true
        });

    if (error) {
        console.error('Upload failed:', error.message);
        if (error.message.includes('row-level security') && !env.SUPABASE_SERVICE_ROLE_KEY) {
            console.warn('\nWARNING: You are using the Anon Key. Standard RLS policies usually prevent anonymous uploads.');
            console.warn('To fix this, either:');
            console.warn('1. Add SUPABASE_SERVICE_ROLE_KEY=... to your .env file');
            console.warn('2. Or manually upload the file in the Supabase Dashboard > Storage > assets');
        }
    } else {
        console.log('✅ Success! Logo uploaded to database storage.');
        console.log('Path: assets/logo.png');

        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl('logo.png');
        console.log('Public URL:', publicUrl);
        console.log('\nThe app will now automatically use this database stored logo.');
    }
}

uploadLogo();
