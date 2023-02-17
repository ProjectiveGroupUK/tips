// React
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Interfaces
import { ProcessDataInterface } from '@/interfaces/Interfaces';

// Mock data
import mockDataSet from '@/mockData/mockProcessData';

interface PropsInterface {
    processData: ProcessDataInterface;
    children: React.ReactNode;
}

type ProcessDataContextInterface = {
    processData: ProcessDataInterface;
    selectedProcess: ProcessDataInterface[0] | null;
    setSelectedProcessId: React.Dispatch<React.SetStateAction<string | null>>;
}

const ProcessDataContext = createContext<ProcessDataContextInterface>(undefined!);

export function useProcessData() {
    return useContext(ProcessDataContext);
}

const useMockData = false;

export default function ProcessDataContextProvider({ processData: receivedProcessData, children }: PropsInterface) {
    const [processData, setProcessData] = useState<ProcessDataInterface>(useMockData ? mockDataSet : receivedProcessData);
    const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);

    const [selectedProcess, setSelectedProcess] = useState<ProcessDataInterface[0] | null>(null);
    useMemo(() => {
        const dataset = useMockData ? mockDataSet : processData;
        setSelectedProcess(dataset.find((process) => process.id.toString() === selectedProcessId) || null);
    }, [selectedProcessId, (useMockData ? mockDataSet : processData)]);

    useEffect(() => { setProcessData(useMockData ? mockDataSet : processData); }, [useMockData ? mockDataSet : processData]); // Update processData variable when prop passed down from Python updates

    const value: ProcessDataContextInterface = {
        processData: useMockData ? mockDataSet : processData,
        selectedProcess,
        setSelectedProcessId
    };

    return (
        <ProcessDataContext.Provider value={value}>
            { children }
        </ProcessDataContext.Provider>
    );
};