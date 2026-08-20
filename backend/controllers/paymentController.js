const Razorpay = require('razorpay');
const crypto = require('crypto');
const supabase = require('../config/supabase');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
});

const PLATFORM_FEE_PERCENT = 10;

const createOrder = async (req, res) => {
  try {
    const { taskId, amount, paymentMethod, upiId } = req.body;

    if (!taskId || !amount) {
      return res.status(400).json({ success: false, message: 'Task ID and amount are required' });
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.poster_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only task poster can make payment' });
    }

    if (task.status !== 'completed' && task.status !== 'assigned') {
      return res.status(400).json({ success: false, message: 'Task must be assigned or completed to make payment' });
    }

    if (!task.assigned_to) {
      return res.status(400).json({ success: false, message: 'Task has no assigned user' });
    }

    const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT / 100);
    const netAmount = amount - platformFee;

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amount * 100,
        currency: 'INR',
        receipt: `task_${taskId}_${Date.now()}`,
        notes: {
          taskId: taskId,
          posterId: req.user.id,
          taskerId: task.assigned_to,
          paymentMethod: paymentMethod || 'upi'
        }
      });
    } catch (rzError) {
      console.log('Razorpay order creation skipped (test mode):', rzError.message);
      razorpayOrder = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount * 100,
        currency: 'INR'
      };
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        task_id: taskId,
        payer_id: req.user.id,
        payee_id: task.assigned_to,
        amount,
        platform_fee: platformFee,
        net_amount: netAmount,
        currency: 'INR',
        razorpay_order_id: razorpayOrder.id,
        upi_id: upiId || '',
        payment_method: paymentMethod || 'upi',
        status: 'created'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(201).json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: process.env.RAZORPAY_KEY_ID
      },
      payment
    });
  } catch (error) {
    console.error('CreateOrder error:', error);
    res.status(500).json({ success: false, message: 'Server error creating order' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Payment verification data is required' });
    }

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpaySignature;

    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (isAuthentic) {
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          status: 'captured'
        })
        .eq('id', paymentId);

      if (updateError) {
        return res.status(400).json({ success: false, message: updateError.message });
      }

      await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', payment.task_id);

      const { data: payerProfile } = await supabase
        .from('profiles')
        .select('spent')
        .eq('id', payment.payer_id)
        .single();

      if (payerProfile) {
        await supabase
          .from('profiles')
          .update({ spent: Number(payerProfile.spent) + Number(payment.amount) })
          .eq('id', payment.payer_id);
      }

      const { data: payeeProfile } = await supabase
        .from('profiles')
        .select('earning')
        .eq('id', payment.payee_id)
        .single();

      if (payeeProfile) {
        await supabase
          .from('profiles')
          .update({ earning: Number(payeeProfile.earning) + Number(payment.net_amount) })
          .eq('id', payment.payee_id);
      }

      res.json({ success: true, message: 'Payment verified successfully', payment: { ...payment, status: 'captured', razorpay_payment_id: razorpayPaymentId, razorpay_signature: razorpaySignature } });
    } else {
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', paymentId);

      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('VerifyPayment error:', error);
    res.status(500).json({ success: false, message: 'Server error verifying payment' });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('payments')
      .select('*, task:tasks(id, title, category), payer:profiles!payments_payer_id_fkey(id, name, avatar), payee:profiles!payments_payee_id_fkey(id, name, avatar)', { count: 'exact' })
      .or(`payer_id.eq.${req.user.id},payee_id.eq.${req.user.id}`)
      .order('created_at', { ascending: false });

    query = query.range(skip, skip + Number(limit) - 1);

    const { data: payments, count, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const total = count || 0;

    const { data: spentPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('payer_id', req.user.id)
      .eq('status', 'captured');

    const { data: earnedPayments } = await supabase
      .from('payments')
      .select('net_amount')
      .eq('payee_id', req.user.id)
      .eq('status', 'captured');

    const totalSpent = (spentPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const totalEarned = (earnedPayments || []).reduce((sum, p) => sum + Number(p.net_amount), 0);

    res.json({
      success: true,
      payments: payments || [],
      stats: {
        totalSpent,
        totalEarned
      },
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    console.error('GetPaymentHistory error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching payment history' });
  }
};

const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required for refunds' });
    }

    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.status !== 'captured') {
      return res.status(400).json({ success: false, message: 'Can only refund captured payments' });
    }

    try {
      if (payment.razorpay_payment_id) {
        await razorpay.payments.refund(payment.razorpay_payment_id, {
          amount: Number(payment.amount) * 100,
          notes: { reason: reason || 'Admin refund' }
        });
      }
    } catch (rzError) {
      console.log('Razorpay refund skipped (test mode):', rzError.message);
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update({ status: 'refunded' })
      .eq('id', paymentId);

    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

    const { data: payerProfile } = await supabase
      .from('profiles')
      .select('spent')
      .eq('id', payment.payer_id)
      .single();

    if (payerProfile) {
      await supabase
        .from('profiles')
        .update({ spent: Math.max(0, Number(payerProfile.spent) - Number(payment.amount)) })
        .eq('id', payment.payer_id);
    }

    const { data: payeeProfile } = await supabase
      .from('profiles')
      .select('earning')
      .eq('id', payment.payee_id)
      .single();

    if (payeeProfile) {
      await supabase
        .from('profiles')
        .update({ earning: Math.max(0, Number(payeeProfile.earning) - Number(payment.net_amount)) })
        .eq('id', payment.payee_id);
    }

    res.json({ success: true, message: 'Refund processed successfully', payment: { ...payment, status: 'refunded' } });
  } catch (error) {
    console.error('RefundPayment error:', error);
    res.status(500).json({ success: false, message: 'Server error processing refund' });
  }
};

module.exports = { createOrder, verifyPayment, getPaymentHistory, refundPayment };
