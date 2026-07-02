// src/hooks/useWallet.ts
import { useEffect, useCallback } from "react";
import { useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";

// Support multiple chains for flexibility (Base Sepolia is primary)
const injected = new InjectedConnector({
    supportedChainIds: [84532, 1, 11155111, 8453], // Base Sepolia, Mainnet, Sepolia, Base
});

export const useWallet = () => {
    const { activate, deactivate, account, active, library } = useWeb3React();

    // Auto-connect if previously connected
    /*useEffect(() => {
        const connected = localStorage.getItem("walletConnected");
        if (connected === "true") {
            activate(injected).catch(() => {
                // ignore errors
            });
        }
    }, [activate]);*/

    // Listen to account changes in MetaMask
    useEffect(() => {
        const { ethereum } = window as any;
        if (ethereum && ethereum.on) {
            const handleAccountsChanged = (accounts: string[]) => {
                console.log("MetaMask accountsChanged:", accounts);
                if (accounts.length === 0) {
                    // User has locked MetaMask or disconnected all accounts
                    console.log("No accounts available, deactivating");
                    deactivate();
                    localStorage.removeItem("walletConnected");
                } else {
                    // Account changed; web3-react will update `account`
                    console.log("New account:", accounts[0]);
                }
            };
            const handleChainChanged = (chainId: string) => {
                console.log("Chain changed to", chainId);
                // Optionally: if wrong chain, you can deactivate or show warning
            };
            ethereum.on("accountsChanged", handleAccountsChanged);
            ethereum.on("chainChanged", handleChainChanged);

            return () => {
                if (ethereum.removeListener) {
                    ethereum.removeListener("accountsChanged", handleAccountsChanged);
                    ethereum.removeListener("chainChanged", handleChainChanged);
                }
            };
        }
    }, [deactivate]);

    const connect = useCallback(async () => {
        try {
            // Check if MetaMask is installed (with retry for slow injection)
            let ethereum = (window as any).ethereum;
            
            if (!ethereum) {
                // Wait a moment and try again (MetaMask can be slow to inject)
                await new Promise(resolve => setTimeout(resolve, 500));
                ethereum = (window as any).ethereum;
            }
            
            if (!ethereum) {
                alert("Please install MetaMask to use this application!");
                window.open("https://metamask.io/download/", "_blank");
                return;
            }
            
            if (active) {
                await deactivate();
            }
            
            // Try to activate with the injected connector
            await activate(injected, undefined, true);
            localStorage.setItem("walletConnected", "true");
        } catch (err: any) {
            console.error("Connection error:", err);
            
            // If web3-react fails, try direct MetaMask connection as fallback
            try {
                const ethereum = (window as any).ethereum;
                if (ethereum) {
                    await ethereum.request({ method: 'eth_requestAccounts' });
                    await activate(injected);
                    localStorage.setItem("walletConnected", "true");
                    return;
                }
            } catch (fallbackErr) {
                console.error("Fallback connection also failed:", fallbackErr);
            }
            
            if (err?.code === 4001) {
                alert("Connection rejected. Please approve the connection in MetaMask.");
            } else if (err?.name === "UnsupportedChainIdError") {
                alert("Please switch to Base Sepolia network in MetaMask (Chain ID: 84532)");
            } else {
                alert("Failed to connect wallet. Check that MetaMask is unlocked and try again.");
            }
            throw err;
        }
    }, [activate, deactivate, active]);

    const disconnect = useCallback(() => {
        try {
            deactivate();
        } catch { }
        localStorage.removeItem("walletConnected");
    }, [deactivate]);

    return { connect, disconnect, account, active, library };
};
