require('dotenv').config();
const supabase = require('./config/supabase');
const bcrypt = require('bcryptjs');

const cities = [
  { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
  { city: 'Delhi', state: 'Delhi', pincode: '110001' },
  { city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
  { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
  { city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
  { city: 'Pune', state: 'Maharashtra', pincode: '411001' }
];

const sampleUsers = [
  { name: 'Rahul Sharma', email: 'rahul@example.com', password: 'password123', phone: '9876543210', role: 'both', bio: 'Experienced professional with 5+ years in handyman services.', location: cities[0], skills: ['plumbing', 'electrical', 'handyman', 'moving'], verified: true, rating: 4.5, total_reviews: 24, completed_tasks: 45, earning: 125000, spent: 15000, upi_id: 'rahul@upi' },
  { name: 'Priya Patel', email: 'priya@example.com', password: 'password123', phone: '9876543211', role: 'tasker', bio: 'Professional cleaner and organizer.', location: cities[1], skills: ['cleaning', 'cooking', 'gardening'], verified: true, rating: 4.8, total_reviews: 56, completed_tasks: 89, earning: 210000, spent: 5000, upi_id: 'priya@upi' },
  { name: 'Amit Kumar', email: 'amit@example.com', password: 'password123', phone: '9876543212', role: 'poster', bio: 'Business owner looking for reliable taskers.', location: cities[2], skills: [], verified: true, rating: 4.2, total_reviews: 12, completed_tasks: 0, earning: 0, spent: 85000, is_business: true, business_name: 'Kumar Enterprises', business_type: 'IT Services' },
  { name: 'Sneha Reddy', email: 'sneha@example.com', password: 'password123', phone: '9876543213', role: 'tasker', bio: 'Creative designer and photographer.', location: cities[4], skills: ['photography', 'design', 'web_development'], verified: true, rating: 4.7, total_reviews: 38, completed_tasks: 62, earning: 185000, spent: 12000, upi_id: 'sneha@upi' },
  { name: 'Vikram Singh', email: 'vikram@example.com', password: 'password123', phone: '9876543214', role: 'both', bio: 'Fitness trainer and cooking enthusiast.', location: cities[3], skills: ['fitness', 'cooking', 'moving'], verified: true, rating: 4.4, total_reviews: 19, completed_tasks: 34, earning: 78000, spent: 22000, upi_id: 'vikram@upi' },
  { name: 'Admin User', email: 'admin@alltasker.com', password: 'admin123', phone: '9876543215', role: 'admin', bio: 'AllTasker platform administrator.', location: cities[0], skills: [], verified: true, rating: 5, total_reviews: 0, completed_tasks: 0, earning: 0, spent: 0 }
];

const seedDB = async () => {
  try {
    console.log('Starting Supabase seed...');

    await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('offers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Cleared existing data');

    const userIds = [];
    for (const userData of sampleUsers) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });

      if (authError) {
        console.log(`Auth user ${userData.email} may already exist, skipping...`);
        continue;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          bio: userData.bio,
          location: userData.location,
          skills: userData.skills,
          verified: userData.verified,
          rating: userData.rating,
          total_reviews: userData.total_reviews,
          completed_tasks: userData.completed_tasks,
          earning: userData.earning,
          spent: userData.spent,
          upi_id: userData.upi_id || '',
          is_business: userData.is_business || false,
          business_name: userData.business_name || '',
          business_type: userData.business_type || ''
        });

      if (profileError) {
        console.error(`Error creating profile for ${userData.email}:`, profileError.message);
      } else {
        userIds.push(authData.user.id);
        console.log(`Created user: ${userData.name} (${userData.email})`);
      }
    }

    if (userIds.length < 2) {
      console.error('Not enough users created. Aborting seed.');
      process.exit(1);
    }

    const posterId = userIds[2];
    const taskerIds = [userIds[0], userIds[1], userIds[3], userIds[4]];

    const taskData = [
      { title: 'Deep cleaning of 2BHK apartment', description: 'I need a thorough deep cleaning of my 2BHK apartment. Kitchen and bathroom need extra attention.', category: 'cleaning', budget_min: 1500, budget_max: 2500, location_address: 'Andheri West', location_city: 'Mumbai', location_state: 'Maharashtra', location_pincode: '400001', poster_id: posterId, status: 'open', urgency: 'normal', tags: ['deep cleaning', 'apartment'], scheduled_date: new Date(Date.now() + 3 * 86400000).toISOString(), scheduled_time: '10:00 AM' },
      { title: 'Fix leaking tap and install faucet', description: 'My kitchen tap has been leaking for a week. I also need a new faucet installed.', category: 'plumbing', budget_min: 500, budget_max: 1000, location_address: 'Koramangala', location_city: 'Bangalore', location_state: 'Karnataka', location_pincode: '560001', poster_id: posterId, status: 'open', urgency: 'urgent', tags: ['plumbing', 'leak repair'], scheduled_date: new Date(Date.now() + 1 * 86400000).toISOString(), scheduled_time: '2:00 PM' },
      { title: 'Website development for bakery', description: 'Need a professional website for my bakery shop. Should include menu display, order form, contact page.', category: 'web_development', budget_min: 15000, budget_max: 30000, location_address: 'HSR Layout', location_city: 'Bangalore', location_state: 'Karnataka', location_pincode: '560001', poster_id: posterId, status: 'open', urgency: 'normal', tags: ['website', 'business'], scheduled_date: new Date(Date.now() + 14 * 86400000).toISOString() },
      { title: 'Garden maintenance and landscaping', description: 'Need someone to maintain my front and back garden. Includes mowing, trimming hedges, weeding.', category: 'gardening', budget_min: 2000, budget_max: 4000, location_address: 'Baner', location_city: 'Pune', location_state: 'Maharashtra', location_pincode: '411001', poster_id: posterId, status: 'open', urgency: 'normal', tags: ['gardening', 'landscaping'], scheduled_date: new Date(Date.now() + 5 * 86400000).toISOString(), scheduled_time: '7:00 AM' },
      { title: 'Moving help - Shift furniture to new flat', description: 'Moving from HSR Layout to Indiranagar. Need help shifting sofa set, bed, dining table, and boxes.', category: 'moving', budget_min: 3000, budget_max: 5000, location_address: 'HSR Layout', location_city: 'Bangalore', location_state: 'Karnataka', location_pincode: '560001', poster_id: posterId, status: 'open', urgency: 'urgent', tags: ['moving', 'furniture'], scheduled_date: new Date(Date.now() + 2 * 86400000).toISOString(), scheduled_time: '6:00 AM' },
      { title: 'Math tutor for Class 10 student', description: 'Looking for experienced math tutor. Need help with algebra, geometry, and trigonometry.', category: 'tutoring', budget_min: 500, budget_max: 800, location_address: 'JP Nagar', location_city: 'Bangalore', location_state: 'Karnataka', location_pincode: '560001', poster_id: posterId, status: 'open', urgency: 'normal', tags: ['tutoring', 'math'], scheduled_date: new Date(Date.now() + 7 * 86400000).toISOString() },
      { title: 'Birthday party catering for 30 people', description: 'Need a cook for my sons birthday party. Menu: North Indian and Chinese dishes.', category: 'cooking', budget_min: 4000, budget_max: 7000, location_address: 'Vasant Kunj', location_city: 'Delhi', location_state: 'Delhi', location_pincode: '110001', poster_id: posterId, status: 'open', urgency: 'normal', tags: ['cooking', 'catering'], scheduled_date: new Date(Date.now() + 10 * 86400000).toISOString(), scheduled_time: '11:00 AM' },
      { title: 'Electrical wiring for new office', description: 'Need an electrician for new office. Installing 15 power points, 8 light fixtures, 2 AC points.', category: 'electrical', budget_min: 5000, budget_max: 8000, location_address: 'MG Road', location_city: 'Chennai', location_state: 'Tamil Nadu', location_pincode: '600001', poster_id: posterId, status: 'open', urgency: 'very_urgent', tags: ['electrical', 'wiring'], scheduled_date: new Date(Date.now() + 1 * 86400000).toISOString(), scheduled_time: '9:00 AM' }
    ];

    const taskIds = [];
    for (const t of taskData) {
      const { data: task, error } = await supabase
        .from('tasks')
        .insert(t)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating task:', error.message);
      } else {
        taskIds.push(task.id);
        console.log(`Created task: ${t.title}`);
      }
    }

    if (taskIds.length > 1) {
      await supabase.from('offers').insert([
        { task_id: taskIds[1], tasker_id: taskerIds[0], amount: 800, message: 'I can fix the tap and install the faucet in 2 hours.', estimated_time: '2 hours', status: 'pending' },
        { task_id: taskIds[1], tasker_id: taskerIds[1], amount: 650, message: 'I have experience with plumbing repairs. Can do it today.', estimated_time: '1.5 hours', status: 'pending' }
      ]);
      console.log('Created offers for plumbing task');

      await supabase.from('questions').insert([
        { task_id: taskIds[0], user_id: taskerIds[1], question: 'How many rooms need cleaning? Is balcony included?', answer: '2 bedrooms, 1 living room, kitchen, 2 bathrooms. Yes, balcony is included.' },
        { task_id: taskIds[0], user_id: taskerIds[0], question: 'What cleaning supplies do you have?', answer: 'I have basic supplies but prefer if you bring professional-grade ones.' }
      ]);
      console.log('Created questions for cleaning task');

      await supabase.from('reviews').insert([
        { task_id: taskIds[1], reviewer_id: posterId, reviewee_id: taskerIds[0], rating: 5, comment: 'Excellent work! Rahul fixed the tap quickly and professionally.' },
        { task_id: taskIds[0], reviewer_id: posterId, reviewee_id: taskerIds[1], rating: 4, comment: 'Good cleaning job. The apartment was spotless. Would hire again.' }
      ]);
      console.log('Created reviews');
    }

    console.log('\n--- Seed Complete ---');
    console.log('\nSample User Credentials:');
    console.log('  rahul@example.com / password123 (Both)');
    console.log('  priya@example.com / password123 (Tasker)');
    console.log('  amit@example.com / password123 (Poster)');
    console.log('  sneha@example.com / password123 (Tasker)');
    console.log('  vikram@example.com / password123 (Both)');
    console.log('  admin@alltasker.com / admin123 (Admin)');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
