import { useWallets } from '@privy-io/react-auth';
import { getVaultAPR, getVaultPosition, depositVault, zap, bridgeAndZap } from './ToolAPI';
import React, { useState } from 'react';
import { Address } from 'viem';

export const Testing = () => {
  const { ready, wallets } = useWallets();
  const wallet = wallets[0];

  console.log('Ready', ready);
  console.log('Wallets', wallets);
  console.log('wallet address', wallet?.address);

  // Deposit form states
  const [depositStrategy, setDepositStrategy] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  // View Position and APR forms
  const [positionStrategy, setPositionStrategy] = useState('');
  const [aprStrategy, setAprStrategy] = useState('');

  // Zap form states
  const [zapStrategy, setZapStrategy] = useState('');
  const [zapTokenIn, setZapTokenIn] = useState('');
  const [zapAmount, setZapAmount] = useState('');

  // Bridge form states
  const [bridgeStrategy, setBridgeStrategy] = useState('');
  const [fromChain, setFromChain] = useState('');
  const [bridgeTokenIn, setBridgeTokenIn] = useState('');
  const [bridgeAmount, setBridgeAmount] = useState('');

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await depositVault(wallet, depositStrategy, depositAmount);
      alert('Deposit successful');
    } catch (err) {
      console.error(err);
      alert('Deposit failed');
    }
  };

  const handleViewPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const position = await getVaultPosition(wallet, positionStrategy);
      alert(`Position: ${position ?? 'No data'}`);
    } catch (err) {
      console.error(err);
      alert('Failed to view position');
    }
  };

  const handleViewAPR = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apr = await getVaultAPR(aprStrategy);
      alert(`APR: ${apr ?? 'No data'}`);
    } catch (err) {
      console.error(err);
      alert('Failed to view APR');
    }
  };

  const handleZap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await zap(wallet, zapTokenIn as Address, zapAmount, zapStrategy);
      alert('Zap successful');
    } catch (err) {
      console.error(err);
      alert('Zap failed');
    }
  };

  const handleBridge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bridgeAndZap(wallet, Number(fromChain), bridgeTokenIn as Address, bridgeAmount, bridgeStrategy);
      alert('Bridge successful');
    } catch (err) {
      console.error(err);
      alert('Bridge failed');
    }
  };

  // ...existing code...
return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', color: '#333' }}>
      <h2 style={{ textAlign: 'center', marginTop: '1rem' }}>Testing Tools</h2>
  
      {/* Deposit Form */}
      <form
        onSubmit={handleDeposit}
        style={{
          border: '1px solid #ccc',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
        }}
      >
        <h3>Deposit</h3>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Strategy Name: </label>
          <input
            type="text"
            value={depositStrategy}
            onChange={(e) => setDepositStrategy(e.target.value)}
            required
            style={{
              marginLeft: '1em',
              padding: '6px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Amount: </label>
          <input
            type="text"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            required
            style={{
              marginLeft: '3.35em',
              padding: '6px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            backgroundColor: '#007BFF',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
          }}
        >
          Deposit
        </button>
      </form>
  
      {/* View Position Form */}
      <form
        onSubmit={handleViewPosition}
        style={{
          border: '1px solid #ccc',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
        }}
      >
        <h3>View Position</h3>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Strategy Name: </label>
          <input
            type="text"
            value={positionStrategy}
            onChange={(e) => setPositionStrategy(e.target.value)}
            required
            style={{
              marginLeft: '1em',
              padding: '6px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            backgroundColor: '#007BFF',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
          }}
        >
          View Position
        </button>
      </form>
  
      {/* View APR Form */}
      <form
        onSubmit={handleViewAPR}
        style={{
          border: '1px solid #ccc',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
        }}
      >
        <h3>View APR</h3>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Strategy Name: </label>
          <input
            type="text"
            value={aprStrategy}
            onChange={(e) => setAprStrategy(e.target.value)}
            required
            style={{
              marginLeft: '1em',
              padding: '6px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            backgroundColor: '#007BFF',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
          }}
        >
          View APR
        </button>
      </form>
  
      {/* Zap Form */}
      <form
        onSubmit={handleZap}
        style={{
          border: '1px solid #ccc',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
        }}
      >
        <h3>Zap</h3>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Strategy Name: </label>
          <input
            type="text"
            value={zapStrategy}
            onChange={(e) => setZapStrategy(e.target.value)}
            required
            style={{
              marginLeft: '1em',
              padding: '6px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Token In: </label>
          <input
            type="text"
            value={zapTokenIn}
            onChange={(e) => setZapTokenIn(e.target.value)}
            required
            style={{
              marginLeft: '3.5em',
              padding: '6px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Amount: </label>
          <input
            type="text"
            value={zapAmount}
            onChange={(e) => setZapAmount(e.target.value)}
            required
            style={{
              marginLeft: '3.35em',
              padding: '6px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            backgroundColor: '#007BFF',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
          }}
        >
          Zap
        </button>
      </form>
  
      {/* Bridge Form */}
      <form
        onSubmit={handleBridge}
        style={{
          border: '1px solid #ccc',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          padding: '1rem',
        }}
      >
        <h3>Bridge</h3>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Strategy Name: </label>
          <input
            type="text"
            value={bridgeStrategy}
            onChange={(e) => setBridgeStrategy(e.target.value)}
            required
            style={{
              marginLeft: '1em',
              padding: '6px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>From Chain ID: </label>
          <input
            type="text"
            value={fromChain}
            onChange={(e) => setFromChain(e.target.value)}
            required
            style={{
              marginLeft: '0.8em',
              padding: '6px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Token In: </label>
          <input
            type="text"
            value={bridgeTokenIn}
            onChange={(e) => setBridgeTokenIn(e.target.value)}
            required
            style={{
              marginLeft: '3.5em',
              padding: '6px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>Amount: </label>
          <input
            type="text"
            value={bridgeAmount}
            onChange={(e) => setBridgeAmount(e.target.value)}
            required
            style={{
              marginLeft: '3.35em',
              padding: '6px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            backgroundColor: '#007BFF',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
          }}
        >
          Bridge
        </button>
      </form>
    </div>
  );
  // ...existing code...
};
