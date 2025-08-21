import { useEffect } from 'react';
import { useAccounts, useCreateAccount } from '@/hooks/useAccounts';
import type { Account } from '@/types/index';

const TestAccounts = () => {
    const { data: accountsData, isLoading, error, refetch } = useAccounts();
    const createAccountMutation = useCreateAccount();

    // Extraer información del error de manera segura
    const errorMessage = error?.message || null;

    useEffect(() => {
        console.log('🔍 TEST - Accounts Data:', {
            accountsData,
            isLoading,
            error: errorMessage,
            accounts: accountsData?.accounts,
            total: accountsData?.total
        });
    }, [accountsData, isLoading, errorMessage]);

    const handleCreateTestAccount = () => {
        const testAccount = {
            name: `Cuenta Test ${Date.now()}`,
            type: 'bank' as const,
            initialBalance: Math.floor(Math.random() * 10000),
            accountNumber: `TEST-${Date.now()}`,
            bankName: 'Banco Test',
            description: 'Cuenta de prueba para debugging'
        };

        console.log('🔍 TEST - Creating account:', testAccount);
        
        createAccountMutation.mutate(testAccount, {
            onSuccess: (data) => {
                console.log('✅ TEST - Account created:', data);
                refetch();
            },
            onError: (error) => {
                console.error('❌ TEST - Error creating account:', error);
            }
        });
    };

    const handleRefresh = () => {
        console.log('🔄 TEST - Manually refreshing...');
        refetch();
    };

    if (isLoading) {
        return <div className="p-4">🔄 Cargando cuentas...</div>;
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="text-red-800 font-bold">❌ Error:</h3>
                <p className="text-red-600">{errorMessage}</p>
                <button 
                    onClick={handleRefresh}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    const accounts = accountsData?.accounts || [];

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">🧪 Test de Cuentas</h1>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                <h2 className="font-bold text-blue-800 mb-2">📊 Estado actual:</h2>
                <ul className="text-blue-700 space-y-1">
                    <li>• Total de cuentas: {accounts.length}</li>
                    <li>• Loading: {isLoading ? 'Sí' : 'No'}</li>
                    <li>• Error: {error ? 'Sí' : 'No'}</li>
                    <li>• Datos disponibles: {accountsData ? 'Sí' : 'No'}</li>
                </ul>
            </div>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={handleCreateTestAccount}
                    disabled={createAccountMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                    {createAccountMutation.isPending ? '⏳ Creando...' : '➕ Crear Cuenta Test'}
                </button>
                
                <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    🔄 Refrescar
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded">
                <h2 className="font-bold p-4 border-b">📋 Lista de Cuentas ({accounts.length})</h2>
                
                {accounts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        📭 No hay cuentas registradas
                    </div>
                ) : (
                    <div className="divide-y">
                        {accounts.map((account: Account, index: number) => (
                            <div key={account._id || index} className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold">{account.name}</h3>
                                        <p className="text-sm text-gray-600">
                                            Tipo: {account.type} | Saldo: ${account.balance || 0}
                                        </p>
                                        {account.accountNumber && (
                                            <p className="text-sm text-gray-500">
                                                Número: {account.accountNumber}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-1 text-xs rounded ${
                                            account.status === 'active' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {account.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-6 bg-gray-50 border border-gray-200 rounded p-4">
                <h3 className="font-bold mb-2">🔍 Raw Data:</h3>
                <pre className="text-xs overflow-auto bg-white p-2 rounded border">
                    {JSON.stringify({ 
                        accountsData, 
                        isLoading, 
                        error: errorMessage 
                    }, null, 2)}
                </pre>
            </div>
        </div>
    );
};

export default TestAccounts;
