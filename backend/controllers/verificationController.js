const supabase = require('../config/supabase');

const requestVerification = async (req, res) => {
  try {
    const { doc1Url, doc2Url } = req.body;

    if (!doc1Url || !doc2Url) {
      return res.status(400).json({ success: false, message: 'Both document URLs are required' });
    }

    const { data: existing } = await supabase
      .from('verification_requests')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have a pending verification request' });
    }

    const { data: request, error } = await supabase
      .from('verification_requests')
      .insert({
        user_id: req.user.id,
        doc1_url: doc1Url,
        doc2_url: doc2Url,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    await supabase
      .from('profiles')
      .update({ verification_status: 'pending', verification_doc1: doc1Url, verification_doc2: doc2Url })
      .eq('id', req.user.id);

    res.status(201).json({ success: true, request });
  } catch (error) {
    console.error('RequestVerification error:', error);
    res.status(500).json({ success: false, message: 'Server error requesting verification' });
  }
};

const getMyVerification = async (req, res) => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('verified, verified_at, verification_status, verification_doc1, verification_doc2, verification_notes')
      .eq('id', req.user.id)
      .single();

    if (profileError) {
      return res.status(400).json({ success: false, message: profileError.message });
    }

    const { data: requests, error: requestsError } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (requestsError) {
      return res.status(400).json({ success: false, message: requestsError.message });
    }

    res.json({ success: true, profile, requests: requests || [] });
  } catch (error) {
    console.error('GetMyVerification error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching verification status' });
  }
};

const adminReviewRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const { data: request, error: fetchError } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ success: false, message: 'Verification request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request has already been reviewed' });
    }

    const { error: updateError } = await supabase
      .from('verification_requests')
      .update({
        status,
        admin_notes: adminNotes || '',
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

    if (status === 'approved') {
      await supabase
        .from('profiles')
        .update({
          verified: true,
          verified_at: new Date().toISOString(),
          verification_status: 'approved'
        })
        .eq('id', request.user_id);
    } else {
      await supabase
        .from('profiles')
        .update({
          verification_status: 'rejected',
          verification_notes: adminNotes || ''
        })
        .eq('id', request.user_id);
    }

    res.json({ success: true, message: `Request ${status}` });
  } catch (error) {
    console.error('AdminReviewRequest error:', error);
    res.status(500).json({ success: false, message: 'Server error reviewing verification request' });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const { data: requests, error } = await supabase
      .from('verification_requests')
      .select('*, user:profiles!verification_requests_user_id_fkey(id, name, avatar, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({ success: true, requests: requests || [] });
  } catch (error) {
    console.error('GetPendingRequests error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching pending requests' });
  }
};

module.exports = { requestVerification, getMyVerification, adminReviewRequest, getPendingRequests };
