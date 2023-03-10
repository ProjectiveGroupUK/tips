// React
import { createContext, useContext, useState, useEffect } from 'react';

// Streamlit
import { Streamlit } from 'streamlit-component-lib';

// Interfaces
import { PropsInterface_ProcessModal } from '@/App';
import { ProcessDataInterface, ExecutionStatusInterface } from '@/interfaces/Interfaces';

// Enums
import { ExecutionStatus, OperationType } from '@/enums/enums';

const ProcessModalDataContext = createContext<ContextInterface>(undefined!);

interface ContextInterface {
    executionStatus: ExecutionStatusInterface; // Internal (react) use only
    setExecutionStatus: React.Dispatch<React.SetStateAction<ExecutionStatusInterface>>; // Internal (react) use only
    process: ProcessInterface | null;
    setProcess: React.Dispatch<React.SetStateAction<ProcessInterface | null>>;
}

interface ProcessInterface {
    operation: {
        type: OperationType;
    }
    process: ProcessDataInterface;
    executionStatus: ExecutionStatus;
}

export function useProcessModalData() {
    return useContext(ProcessModalDataContext);
}

export default function ProcessModalDataContextProvider({ process: receivedProcess, instructions, children }: PropsInterface_ProcessModal & { children: React.ReactNode }) {
    const [executionStatus, setExecutionStatus] = useState<ExecutionStatusInterface>({ status: ExecutionStatus.NONE });
    const [process, setProcess] = useState<ProcessInterface | null>(receivedProcess ? { ...receivedProcess, executionStatus: ExecutionStatus.NONE } : null)

    useEffect(() => { // Update Streamlit when any of the values in the context change
        Streamlit.setComponentValue(getObjectWithoutFunctions(value));
    }, [/*executionStatus, */process]);

    if(process !== null && ((receivedProcess.process.PROCESS_ID !== process.process.PROCESS_ID) || (receivedProcess.operation.type !== process.operation.type))) { // Update process if receivedProcessData has updated and is pushing override of id and/or operation type (happens when new process has just been created and Python instructs react to render the new process in editing mode)
        setProcess((prev) => prev 
            ? ({
                ...prev, 
                process: {
                    ...prev.process,
                    id: receivedProcess.process.PROCESS_ID
                },
                operation: {
                    ...prev.operation,
                    type: receivedProcess.operation.type
                }
            })
            : null
        );
    }

    useEffect(() => { // Interpret and act upon instructions sent from Python
        const { processExecutionStatus } = instructions;

        // Reset process processing indicator and temporarily store executing status (would be instructed if ProcessModal component instructed Python to perform SQL operation to create/update process in database, and Python has confirmed completing this instruction)
        if(processExecutionStatus.status === ExecutionStatus.SUCCESS || processExecutionStatus.status === ExecutionStatus.FAIL) {
            setExecutionStatus(processExecutionStatus);
            setProcess((prev) => prev
                ? {
                    ...prev,
                    executionStatus: ExecutionStatus.NONE // Reset the external execution status indicator so that Python knows that instruction was acknowledged
                } 
                : null
            );
        }
        else setExecutionStatus((prev) =>  prev.status === ExecutionStatus.NONE ? prev : { status: ExecutionStatus.NONE }); // Check if execution status is NONE already prior to resetting to avoid infinite re-rendering
    }, [instructions])

    const value: ContextInterface = {
        executionStatus, setExecutionStatus,
        process, setProcess
    }

    return <ProcessModalDataContext.Provider value={value}>
        {children}
    </ProcessModalDataContext.Provider>
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