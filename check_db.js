import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env', 'utf8')
const supabaseUrl = envFile.match(/VITE_SUPABASE_URL="(.*)"/)[1]
const supabaseKey = envFile.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*)"/)[1]

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  console.log("Checking project:", supabaseUrl)
  try {
    const { data, error } = await supabase.from('finance_transactions').select('*').limit(1)
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('not found')) {
        console.log("❌ Table 'finance_transactions' NOT found. Migration needs to be applied.");
      } else {
        console.log("⚠️ Error checking table:", error.message);
      }
    } else {
      console.log("✅ Table 'finance_transactions' found!");
    }
  } catch (e) {
    console.log("❌ Execution error:", e.message);
  }
}
check()
