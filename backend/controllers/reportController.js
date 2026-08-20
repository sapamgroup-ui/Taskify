const supabase = require('../config/supabase');

const createReport = async (req, res) => {
  try {
    const { reportedUserId, taskId, reason, description } = req.body;

    if (!reportedUserId || !reason || !description) {
      return res.status(400).json({ success: false, message: 'Reported user ID, reason, and description are required' });
    }

    if (reportedUserId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot report yourself' });
    }

    let existingQuery = supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', req.user.id)
      .eq('reported_user_id', reportedUserId)
      .neq('status', 'dismissed');

    if (taskId) {
      existingQuery = existingQuery.eq('task_id', taskId);
    }

    const { data: existingReport } = await existingQuery.single();

    if (existingReport) {
      return res.status(400).json({ success: false, message: 'You have already reported this user for this task' });
    }

    const reportData = {
      reporter_id: req.user.id,
      reported_user_id: reportedUserId,
      reason,
      description,
      status: 'pending'
    };

    if (taskId) {
      reportData.task_id = taskId;
    }

    const { data: report, error } = await supabase
      .from('reports')
      .insert(reportData)
      .select('*, reporter:profiles!reports_reporter_id_fkey(id, name, avatar), reportedUser:profiles!reports_reported_user_id_fkey(id, name, avatar)')
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(201).json({ success: true, report });
  } catch (error) {
    console.error('CreateReport error:', error);
    res.status(500).json({ success: false, message: 'Server error creating report' });
  }
};

const getMyReports = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('reports')
      .select('*, reportedUser:profiles!reports_reported_user_id_fkey(id, name, avatar), task:tasks(id, title, category)', { count: 'exact' })
      .eq('reporter_id', req.user.id)
      .order('created_at', { ascending: false });

    query = query.range(skip, skip + Number(limit) - 1);

    const { data: reports, count, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const total = count || 0;

    res.json({
      success: true,
      reports: reports || [],
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('GetMyReports error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching reports' });
  }
};

const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, reason } = req.query;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    let query = supabase
      .from('reports')
      .select('*, reporter:profiles!reports_reporter_id_fkey(id, name, avatar, email), reportedUser:profiles!reports_reported_user_id_fkey(id, name, avatar, email), task:tasks(id, title, category)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (reason) {
      query = query.eq('reason', reason);
    }

    query = query.order('created_at', { ascending: false });

    const skip = (Number(page) - 1) * Number(limit);
    query = query.range(skip, skip + Number(limit) - 1);

    const { data: reports, count, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const total = count || 0;

    res.json({
      success: true,
      reports: reports || [],
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('GetAllReports error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching all reports' });
  }
};

const updateReportStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { data: existingReport, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !existingReport) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.admin_notes = adminNotes;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const { data: report, error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', req.params.id)
      .select('*, reporter:profiles!reports_reporter_id_fkey(id, name, avatar), reportedUser:profiles!reports_reported_user_id_fkey(id, name, avatar)')
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({ success: true, report });
  } catch (error) {
    console.error('UpdateReportStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error updating report status' });
  }
};

module.exports = { createReport, getMyReports, getAllReports, updateReportStatus };
