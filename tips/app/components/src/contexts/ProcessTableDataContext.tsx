// React
import { createContext, useContext, useState, useEffect } from 'react';

// Streamlit
import { Streamlit } from 'streamlit-component-lib';

// Supporting functions
import { getObjectWithoutFunctions } from '@/supportingFunctions/getObjectWithoutFunctions';

// Interfaces
import { ProcessDataInterface, CommandDataInterface } from '@/interfaces/Interfaces';
import { PropsInterface_ProcessTable } from '@/App';

// Enums
import { ExecutionStatus, OperationType } from '@/enums/enums';

const ProcessTableDataContext = createContext<ContextInterface>(undefined!);

interface ContextInterface {
    processData: ProcessDataInterface[];
    editedProcess: EditedProcessInterface | null;
    setEditedProcess: React.Dispatch<React.SetStateAction<EditedProcessInterface | null>>;
    command: CommandInterface | null;
    setCommand: React.Dispatch<React.SetStateAction<CommandInterface | null>>;
}

interface EditedProcessInterface {
    operation: {
        type: OperationType;
    }
    process: ProcessDataInterface;
    executionStatus: ExecutionStatus;
}

interface CommandInterface {
    operation: {
        type: OperationType;
    }
    process: ProcessDataInterface;
    command: CommandDataInterface | null;
    executionStatus: ExecutionStatus;
}

export function useProcessTableData() {
    return useContext(ProcessTableDataContext);
}

export default function ProcessTableDataContextProvider({ processData: receivedProcessData, instructions, children }: PropsInterface_ProcessTable & { children: React.ReactNode }) {
    const [processData, setProcessData] = useState<ProcessDataInterface[]>(receivedProcessData ?? []);
    const [editedProcess, setEditedProcess] = useState<EditedProcessInterface | null>(null);
    const [command, setCommand] = useState<CommandInterface | null>(null);

    useEffect(() => { // Update Streamlit when any of the values in the context change
        Streamlit.setComponentValue(getObjectWithoutFunctions(value));
    }, [command, editedProcess]);

    if(JSON.stringify(receivedProcessData ?? []) !== JSON.stringify(processData)) { // Update processData variable when prop passed down from Python updates (useEffect hook does not fire when prop updates)
        setProcessData(receivedProcessData ?? []);
    }

    useEffect(() => { // Interpret and act upon instructions sent from Python
        const { resetProcessTableProcess, resetProcessTableCommand } = instructions;
        if(resetProcessTableProcess) setEditedProcess(null); // Reset edited process (would be instructed if ProcessModal component was closed)
        if(resetProcessTableCommand) setCommand(null); // Reset command (would be instructed if CommandMOdal component was closed)        
    }, [instructions]);

    const value: ContextInterface = {
        processData,
        editedProcess, setEditedProcess,
        command, setCommand
    };

    return (
        <ProcessTableDataContext.Provider value={value}>
            { children }
        </ProcessTableDataContext.Provider>
    )
}