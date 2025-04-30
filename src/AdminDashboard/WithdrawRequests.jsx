import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

async function handleAction(id, status) {
  // Update withdraw_requests table
  await supabase.from('withdraw_requests').update({ status }).eq('id', id);
  // Fetch the request to get user_id and amount
  const { data: req } = await supabase
    .from('withdraw_requests')
    .select('user_id, amount')
    .eq('id', id)
    .single();
  if (req) {
    // Update the latest matching wallet_transactions row for this withdrawal
    await supabase
      .from('wallet_transactions')
      .update({ status })
      .eq('user_id', req.user_id)
      .eq('type', 'withdrawal')
      .eq('amount', req.amount)
      .order('created_at', { ascending: false })
      .limit(1);

    // If rejected, refund the amount
    if (status === 'rejected') {
      // 1. Add amount back to wallet
      // Fetch current balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', req.user_id)
        .single();
      const newBalance = (wallet?.balance || 0) + req.amount;
      await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', req.user_id);

      // 2. Log refund transaction
      await supabase.from('wallet_transactions').insert([{
        user_id: req.user_id,
        type: 'withdrawal_reversal',
        amount: req.amount,
        balance_after: newBalance,
        description: 'Withdrawal request rejected, amount refunded',
        status: 'completed'
      }]);
    }
  }
  fetchRequests();
}

const WithdrawRequests = () => {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    const { data } = await supabase.from('withdraw_requests').select('*');
    setRequests(data);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div>
      {/* Render your requests here */}
    </div>
  );
};

export default WithdrawRequests; 