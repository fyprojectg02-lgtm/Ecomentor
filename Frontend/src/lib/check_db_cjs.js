const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkStudents() {
    console.log("Checking Supabase connection...");

    const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error("Error fetching students count:", error);
    } else {
        console.log(`Total students in 'students' table: ${count}`);
    }

    const { data: leaderboard, error: lError } = await supabase
        .from('leaderboard_global')
        .select('*');

    if (lError) {
        console.error("Error fetching leaderboard_global:", lError);
    } else {
        console.log(`Total entries in 'leaderboard_global' view: ${leaderboard?.length || 0}`);
        if (leaderboard && leaderboard.length > 0) {
            console.log("Sample student name:", leaderboard[0].name);
        }
    }
}

checkStudents();
