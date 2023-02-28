// React
import { createContext, useContext, useMemo, useState, useEffect } from 'react';

// Streamlit
import { Streamlit } from 'streamlit-component-lib';

// Interfaces
import { CommandDataInterface, ProcessDataInterface } from '@/interfaces/Interfaces';

// Mock data
import mockDataSet from '@/mockData/mockProcessData';

const useMockData = false;

const SharedDataContext = createContext<SharedDataContextInterface>(undefined!);

interface PropsInterface {
    instructions?: { // Instructions sent from Python to be performed by react component
        resetSelectedCommand?: boolean;
        resetUpdateCommand?: boolean;
    }
    processData?: ProcessDataInterface;
    selectedProcessId?: ProcessDataInterface[0]['id'];
    selectedCommandId?: CommandDataInterface['PROCESS_CMD_ID'];
    component: 'ProcessTable' | 'ProcessCommandsModal';
    children: React.ReactNode;
}

interface SharedDataContextInterface {
    processData: ProcessDataInterface;
    selectedProcess: ProcessDataInterface[0] | null;
    setSelectedProcessId: React.Dispatch<React.SetStateAction<number | null>>;
    selectedCommand: CommandDataInterface | null;
    setSelectedCommandId: React.Dispatch<React.SetStateAction<number | null>>;
    updateCommand: Partial<CommandDataInterface> | null;
    setUpdateCommand: React.Dispatch<React.SetStateAction<Partial<CommandDataInterface> | null>>;
}

export function useSharedData() {
    return useContext(SharedDataContext);
}

function getObjectWithoutFunctions(obj: Object): Object {
    return Object.entries(obj).reduce((cleansed, [key, value]) => {
        const isFunction = value?.constructor?.name === 'Function';
        if(isFunction) return { ...cleansed };
        return {
            ...cleansed,
            [key]: value
        };
    }, {});
}

export default function SharedDataContextProvider({ processData: receivedProcessData, selectedProcessId: receivedSelectedProcessId, selectedCommandId: receivedSelectedCommandId, instructions, component, children }: PropsInterface) {

    // Set up process data variables
    const [processData, setProcessData] = useState<ProcessDataInterface>(useMockData ? mockDataSet : (receivedProcessData ?? []));
    const [selectedProcessId, setSelectedProcessId] = useState<number | null>(receivedSelectedProcessId ?? null);
    const [selectedProcess, setSelectedProcess] = useState<ProcessDataInterface[0] | null>(null);

    const [selectedCommandId, setSelectedCommandId] = useState<number | null>(receivedSelectedCommandId ?? null);
    const [selectedCommand, setSelectedCommand] = useState<CommandDataInterface | null>(null);

    const [updateCommand, setUpdateCommand] = useState<Partial<CommandDataInterface> | null>(null);

    if(JSON.stringify(receivedProcessData) !== JSON.stringify(processData)) { // Update processData variable when prop passed down from Python updates (useEffect hook does not fire when prop updates)
        setProcessData(receivedProcessData ?? []);
    }

    // Configure hooks to ensure that the selected process and command are always up to date
    useMemo(() => { // Update selectedProcess when selectedProcessId changes
        const dataset = useMockData ? mockDataSet : processData;
        setSelectedProcess(dataset.find((process) => process.id === selectedProcessId) || null);
    }, [selectedProcessId, (useMockData ? mockDataSet : processData)]);

    useMemo(() => { // Update selectedCommand when selectedCommandId changes
        const dataset = useMockData ? mockDataSet : processData;
        setSelectedCommand(dataset.find((process) => process.id === selectedProcessId)?.steps.find((command) => command.PROCESS_CMD_ID === selectedCommandId) || null);
    }, [selectedCommandId, selectedProcessId, (useMockData ? mockDataSet : processData)]);

    useEffect(() => { // Interpret and act upon instructions sent from Python
        if(!instructions) return;
        const { resetSelectedCommand, resetUpdateCommand} = instructions;

        // Reset selected command (would be instructed if modal component in different iFrame was closed)
        if(resetSelectedCommand) setSelectedCommandId(null);

        // Reset update command (would be instructed if EditComandModal component instructed Python to perform SQL operation to update command parameters in database, and Python has confirmed acknowledging this instruction)
        if(resetUpdateCommand) setUpdateCommand(null);
    }, [instructions])


    // Export shared data into variable (to be shared in context)
    const value: SharedDataContextInterface = {

        // Process data
        processData: useMockData ? mockDataSet : processData,
        selectedProcess,
        setSelectedProcessId,
        selectedCommand,
        setSelectedCommandId,
        updateCommand,
        setUpdateCommand
    };

    useEffect(() => { // Update Streamlit when any of the values in the context change
        Streamlit.setComponentValue(getObjectWithoutFunctions(value));
    }, [selectedProcess, selectedCommand, updateCommand]);

    return (
        <SharedDataContext.Provider value={value}>
            { children }
        </SharedDataContext.Provider>
    );
}