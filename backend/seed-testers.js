require('dotenv').config();
const supabase = require('./config/supabase');

const testers = [
  { name: 'Arjun Mehta', email: 'arjun@test.com', password: 'test123', phone: '9000000001', role: 'tasker', skills: ['cleaning', 'handyman', 'plumbing'], location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }, verified: true, rating: 4.6 },
  { name: 'Neha Gupta', email: 'neha@test.com', password: 'test123', phone: '9000000002', role: 'poster', skills: [], location: { city: 'Delhi', state: 'Delhi', pincode: '110001' }, verified: true, rating: 4.3 },
  { name: 'Ravi Verma', email: 'ravi@test.com', password: 'test123', phone: '9000000003', role: 'both', skills: ['delivery', 'moving', 'car_wash'], location: { city: 'Bangalore', state: 'Karnataka', pincode: '560001' }, verified: true, rating: 4.7 },
  { name: 'Pooja Singh', email: 'pooja@test.com', password: 'test123', phone: '9000000004', role: 'tasker', skills: ['cooking', 'catering', 'babysitting'], location: { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' }, verified: true, rating: 4.9 },
  { name: 'Karan Joshi', email: 'karan@test.com', password: 'test123', phone: '9000000005', role: 'poster', skills: [], location: { city: 'Pune', state: 'Maharashtra', pincode: '411001' }, verified: false, rating: 0 },
  { name: 'Ananya Das', email: 'ananya@test.com', password: 'test123', phone: '9000000006', role: 'tasker', skills: ['photography', 'design', 'web_development'], location: { city: 'Hyderabad', state: 'Telangana', pincode: '500001' }, verified: true, rating: 4.4 },
  { name: 'Suresh Nair', email: 'suresh@test.com', password: 'test123', phone: '9000000007', role: 'both', skills: ['electrical', 'painting', 'interior'], location: { city: 'Kochi', state: 'Kerala', pincode: '682001' }, verified: true, rating: 4.1 },
  { name: 'Divya Sharma', email: 'divya@test.com', password: 'test123', phone: '9000000008', role: 'tasker', skills: ['tutoring', 'music', 'event_planning'], location: { city: 'Jaipur', state: 'Rajasthan', pincode: '302001' }, verified: false, rating: 0 },
  { name: 'Vikash Tiwari', email: 'vikash@test.com', password: 'test123', phone: '9000000009', role: 'poster', skills: [], location: { city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001' }, verified: true, rating: 4.0 },
  { name: 'Meera Iyer', email: 'meera@test.com', password: 'test123', phone: '9000000010', role: 'both', skills: ['pet_care', 'gardening', 'laundry', 'security'], location: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' }, verified: true, rating: 4.8 },
];

async function seed() {
  const results = [];

  for (const t of testers) {
    try {
      let userId;

      const { data: existing } = await supabase.auth.admin.listUsers();
      const found = existing?.users?.find(u => u.email === t.email);

      if (found) {
        userId = found.id;
        console.log(`Auth user ${t.email} already exists, inserting profile...`);
      } else {
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: t.email,
          password: t.password,
          email_confirm: true,
        });

        if (authError) throw authError;
        userId = authUser.user.id;
      }

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (existingProfile) {
        console.log(`Profile for ${t.email} already exists, skipping`);
        results.push({ email: t.email, password: t.password, role: t.role, status: 'exists' });
        continue;
      }

      const profile = {
        id: userId,
        name: t.name,
        email: t.email,
        phone: t.phone,
        role: t.role,
        bio: '',
        location: t.location,
        skills: t.skills,
        avatar: '',
        verified: t.verified,
        rating: t.rating,
        total_reviews: 0,
        completed_tasks: 0,
        earning: 0,
        spent: 0,
        upi_id: '',
        bank_details: {},
        is_business: false,
        business_name: '',
        business_type: '',
      };

      const { error: insertError } = await supabase.from('profiles').insert(profile);
      if (insertError) throw insertError;

      console.log(`Created ${t.email}`);
      results.push({ email: t.email, password: t.password, role: t.role, status: 'created' });
    } catch (err) {
      console.error(`Error for ${t.email}:`, err.message);
      results.push({ email: t.email, password: t.password, role: t.role, status: 'error' });
    }
  }

  console.log('\n--- Summary ---');
  console.table(results.map(r => ({ Email: r.email, Password: r.password, Role: r.role, Status: r.status })));
}

seed();
