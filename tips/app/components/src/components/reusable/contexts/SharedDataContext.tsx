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
    instructions: { // Instructions sent from Python to be performed by react component
        resetCreateCommand?: boolean; // Instructs the process table to consider create command modal closed
        resetSelectedCommand?: boolean; // Instructs the process table to consider no process command selected
        createCommandExecutionSucceeded?: boolean; // Notifies the create command modal that command has been successfuly created
        createCommandExecutionFailed?: boolean; // Notifies the create command modal that command creation has failed
        editCommandExecutionSucceeded?: boolean; // Notifies the edit command modal that command has been successfuly updated
        editCommandExecutionFailed?: boolean; // Notifies the edit command modal that command update has failed
    }
    processData?: ProcessDataInterface;
    updateCommand?: UpdateCommandInterface;
    createCommand?: CreateCommandInterface;
    component: 'ProcessTable' | 'ProcessCommandsModal' | 'CreateCommandModal' | 'EditCommandModal';
    children: React.ReactNode;
}

export interface CreateCommandInterface {
    data: CommandDataInterface;
    process: ProcessDataInterface[0];
    executionStatus: 'processing' | 'succeeded' | 'failed' | undefined;
}

export interface UpdateCommandInterface {
    data: Partial<CommandDataInterface> & Required<Pick<CommandDataInterface, 'PROCESS_CMD_ID'>>;
    process: ProcessDataInterface[0];
    executionStatus: 'processing' | 'succeeded' | 'failed' | undefined;
}

interface ExecutionStatusInterface {
    createCommand: boolean | null;
    editCommand: boolean | null;
}

interface SharedDataContextInterface {

    // Process data
    processData: ProcessDataInterface;

    // Acknowledging status of executed operations
    executionStatus: ExecutionStatusInterface;

    // Creating new command
    createCommand: CreateCommandInterface | null;
    setCreateCommand: React.Dispatch<React.SetStateAction<CreateCommandInterface | null>>;

    // Updating command parameters
    updateCommand: UpdateCommandInterface | null;
    setUpdateCommand: React.Dispatch<React.SetStateAction<UpdateCommandInterface | null>>;
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

export default function SharedDataContextProvider({ processData: receivedProcessData, createCommand: receivedCreateCommand, updateCommand: receivedUpdateCommand, instructions, component, children }: PropsInterface) {

    // Set up execution status tracker
    const [executionStatus, setExecutionStatus] = useState<ExecutionStatusInterface>({ createCommand: null, editCommand: null });
    
    // Set up process data variables
    const [processData, setProcessData] = useState<ProcessDataInterface>(useMockData ? mockDataSet : (receivedProcessData ?? []));

    const [createCommand, setCreateCommand] = useState<CreateCommandInterface | null>(receivedCreateCommand ? receivedCreateCommand : null);

    const [updateCommand, setUpdateCommand] = useState<UpdateCommandInterface | null>(receivedUpdateCommand ? receivedUpdateCommand : null);

    if(JSON.stringify(receivedProcessData ?? []) !== JSON.stringify(processData)) { // Update processData variable when prop passed down from Python updates (useEffect hook does not fire when prop updates)
        setProcessData(receivedProcessData ?? []);
    }

    useEffect(() => { // Interpret and act upon instructions sent from Python
        if(!instructions) return;
        const { resetCreateCommand, createCommandExecutionSucceeded, createCommandExecutionFailed, resetSelectedCommand, editCommandExecutionSucceeded, editCommandExecutionFailed} = instructions;

        // Reset create command (would be instructed if CreateCommandModal component was closed)
        if(resetCreateCommand) setCreateCommand(null);

        // Reset create command processing indicator and temporarily store executin status (would be instructed if CreateCommandModal component instructed Python to perform SQL operation to create command in database, and Python has confirmed completing this instruction)
        if(createCommandExecutionSucceeded || createCommandExecutionFailed) {
            setExecutionStatus((prev) => ({ ...prev, createCommand: Boolean(createCommandExecutionSucceeded) })); // No need to check for createCommandExecutionFailed, because this block of code is reached only if either success or fail are true (so if success is false, fail must be true)
            setCreateCommand((prev) => prev
                ? {
                    ...prev,
                    executionStatus: undefined
                } 
                : null
            );
        }
        else setExecutionStatus((prev) => ({ ...prev, createCommand: null })); // Reset execution status if neither execution status variables is assigned

        // Reset update command processing indicator (would be instructed if EditComandModal component instructed Python to perform SQL operation to update command parameters in database, and Python has confirmed completing this instruction)
        if(editCommandExecutionSucceeded || editCommandExecutionFailed) {
            setExecutionStatus((prev) => ({ ...prev, editCommand: Boolean(editCommandExecutionSucceeded) })); // No need to check for editCommandExecutionFailed, because this block of code is reached only if either success or fail are true (so if success is false, fail must be true)
            setUpdateCommand((prev) => prev
                ? {
                    ...prev,
                    executionStatus: undefined
                } 
                : null
            );
        }

        // Reset selected command (would be instructed if modal component in different iFrame was closed)
        if(resetSelectedCommand) setUpdateCommand(null);
    }, [instructions])


    // Export shared data into variable (to be shared in context)
    const value: SharedDataContextInterface = {

        // Process data
        executionStatus,
        processData: useMockData ? mockDataSet : processData,
        createCommand,
        setCreateCommand,
        updateCommand,
        setUpdateCommand
    };

    useEffect(() => { // Update Streamlit when any of the values in the context change
        Streamlit.setComponentValue(getObjectWithoutFunctions(value));
    }, [createCommand, updateCommand]);

    return (
        <SharedDataContext.Provider value={value}>
            { children }
        </SharedDataContext.Provider>
    );
}