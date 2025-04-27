import React from "react";

const SignInPage = () => {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            backgroundColor: '#000'
        }}>
            <h1 style={{ color: 'white', marginBottom: '20px' }}>Sign In</h1>
            <div style={{ 
                padding: '20px',
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #444',
                width: '100%',
                maxWidth: '400px'
            }}>
                <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="email"
                        placeholder="Email"
                        style={{
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid #444',
                            backgroundColor: '#333',
                            color: 'white'
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        style={{
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid #444',
                            backgroundColor: '#333',
                            color: 'white'
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            padding: '10px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: '#f0c419',
                            color: '#000',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SignInPage; 