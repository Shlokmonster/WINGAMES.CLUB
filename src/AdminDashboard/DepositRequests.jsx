import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const DepositRequests = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase.from('deposit_requests').select('*');
    setRequests(data);
  };

  const handleAction = async (id, status) => {
    // Update deposit_requests table
    await supabase.from('deposit_requests').update({ status }).eq('id', id);
    // Fetch the request to get user_id and amount
    const { data: req } = await supabase
      .from('deposit_requests')
      .select('user_id, amount')
      .eq('id', id)
      .single();
    if (req) {
      // Update the latest matching wallet_transactions row for this deposit
      await supabase
        .from('wallet_transactions')
        .update({ status })
        .eq('user_id', req.user_id)
        .eq('type', 'deposit')
        .eq('amount', req.amount)
        .order('created_at', { ascending: false })
        .limit(1);

      // If approved, add amount to wallet and update balance_after
      if (status === 'approved') {
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

        // Update the deposit transaction with the new balance_after
        await supabase
          .from('wallet_transactions')
          .update({ balance_after: newBalance })
          .eq('user_id', req.user_id)
          .eq('type', 'deposit')
          .eq('amount', req.amount)
          .order('created_at', { ascending: false })
          .limit(1);
      }
    }
    fetchRequests();
  };

  return (
    <div>
      {/* Render your requests and handle actions */}
    </div>
  );
};

export default DepositRequests; 