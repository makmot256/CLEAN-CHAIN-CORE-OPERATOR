import { Buffer } from 'buffer';
import process from 'process';

// Polyfills for Web3
window.Buffer = Buffer;
window.process = process;

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import React from "react";
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

function getLibrary(provider: any): Web3Provider {
    return new Web3Provider(provider);
}

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Web3ReactProvider getLibrary={getLibrary}>
            <App />
        </Web3ReactProvider>
    </React.StrictMode>
);

