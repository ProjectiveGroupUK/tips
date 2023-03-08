// React
import { createContext, useContext, useState, useEffect } from 'react';

// Streamlit
import { Streamlit } from 'streamlit-component-lib';

// Interfaces
import { ProcessDataInterface, CommandDataInterface } from '@/interfaces/Interfaces';
import { PropsInterface_ProcessTable } from '@/App';

// Enums
import { ExecutionStatus } from '@/enums/enums';

const ProcessTableDataContext = createContext<ContextInterface>(undefined!);

interface ContextInterface {
    processData: ProcessDataInterface;
    createCommand: CreateCommandInterface | null;
    setCreateCommand: React.Dispatch<React.SetStateAction<CreateCommandInterface | null>>;
    updateCommand: UpdateCommandInterface | null;
    setUpdateCommand: React.Dispatch<React.SetStateAction<UpdateCommandInterface | null>>;
}

interface CreateCommandInterface {
    data: CommandDataInterface;
    process: ProcessDataInterface[0];
    executionStatus: ExecutionStatus;
}

interface UpdateCommandInterface {
    data: Partial<CommandDataInterface> & Required<Pick<CommandDataInterface, 'PROCESS_CMD_ID'>>;
    process: ProcessDataInterface[0];
    executionStatus: ExecutionStatus;
}

export function useProcessTableData() {
    return useContext(ProcessTableDataContext);
}

export default function ProcessTableDataContextProvider({ processData: receivedProcessData, instructions, children }: PropsInterface_ProcessTable & { children: React.ReactNode }) {
    const [processData, setProcessData] = useState<ProcessDataInterface>(receivedProcessData ?? []);
    const [createCommand, setCreateCommand] = useState<CreateCommandInterface | null>(null);
    const [updateCommand, setUpdateCommand] = useState<UpdateCommandInterface | null>(null); 

    useEffect(() => { // Update Streamlit when any of the values in the context change
        Streamlit.setComponentValue(getObjectWithoutFunctions(value));
    }, [createCommand, updateCommand]);

    if(JSON.stringify(receivedProcessData ?? []) !== JSON.stringify(processData)) { // Update processData variable when prop passed down from Python updates (useEffect hook does not fire when prop updates)
        setProcessData(receivedProcessData ?? []);
    }

    useEffect(() => { // Interpret and act upon instructions sent from Python
        const { resetCreateCommand, resetSelectedCommand } = instructions;
        if(resetCreateCommand) setCreateCommand(null); // Reset create command (would be instructed if CreateCommandModal component was closed)        
        if(resetSelectedCommand) setUpdateCommand(null); // Reset selected command (would be instructed if modal component in different iFrame was closed)
    }, [instructions])

    const value: ContextInterface = {
        processData,
        createCommand, setCreateCommand,
        updateCommand, setUpdateCommand
    };

    return (
        <ProcessTableDataContext.Provider value={value}>
            { children }
        </ProcessTableDataContext.Provider>
    )
}

function getObjectWithoutFunctions(obj: Object): Object {
    return Object.entries(obj).reduce((cleansed, [key, value]) => {
        const isFunction = value?.constructor?.name === 'Function';
        if(isFunction) return { ...cleansed };
        return {
            ...cleansed,
            [key]: value
        };
    }, {})
}