// React
import { createContext, useContext, useState, useEffect } from 'react';

// Streamlit
import { Streamlit } from 'streamlit-component-lib';

// Supporting functions
import { getObjectWithoutFunctions } from '@/supportingFunctions/getObjectWithoutFunctions';

// Interfaces
import { PropsInterface_DQModal } from '@/App';
import { DQDataInterface, ExecutionStatusInterface } from '@/interfaces/Interfaces';

// Enums
import { ExecutionStatus, OperationType } from '@/enums/enums';

const DQModalDataContext = createContext<ContextInterface>(undefined!);

interface ContextInterface {
    executionStatus: ExecutionStatusInterface; // Internal (react) use only
    setExecutionStatus: React.Dispatch<React.SetStateAction<ExecutionStatusInterface>>; // Internal (react) use only
    dqdata: DQInterface | null;
    setDQData: React.Dispatch<React.SetStateAction<DQInterface | null>>;
}

interface DQInterface {
    operation: {
        type: OperationType;
    }
    dqdata: DQDataInterface;
    executionStatus: ExecutionStatus;
}

export function useDQModalData() {
    return useContext(DQModalDataContext);
}

export default function DQModalDataContextProvider({ dqdata: receivedDQ, instructions, children }: PropsInterface_DQModal & { children: React.ReactNode }) {
    const [executionStatus, setExecutionStatus] = useState<ExecutionStatusInterface>({ status: ExecutionStatus.NONE });
    const [dqdata, setDQData] = useState<DQInterface | null>(receivedDQ ? { ...receivedDQ, executionStatus: ExecutionStatus.NONE } : null)

    useEffect(() => { // Update Streamlit when any of the values in the context change
        Streamlit.setComponentValue(getObjectWithoutFunctions(value));
    }, [dqdata]);


    if (dqdata !== null && ((receivedDQ.dqdata.PROCESS_DQ_TEST_ID !== dqdata.dqdata.PROCESS_DQ_TEST_ID))) { // Update process if receivedProcessData has updated and is pushing override of id (happens when new process has just been created and Python instructs react to render the new process in editing mode)
        setDQData((prev) => prev
            ? ({
                ...prev,
                dqdata: {
                    ...prev.dqdata,
                    PROCESS_DQ_TEST_ID: receivedDQ.dqdata.PROCESS_DQ_TEST_ID
                },
                operation: {
                    ...prev.operation,
                    type: receivedDQ.operation.type
                }
            })
            : null
        );
    }

    useEffect(() => { // Interpret and act upon instructions sent from Python
        const { dqExecutionStatus } = instructions;

        // Reset process processing indicator and temporarily store executing status (would be instructed if ProcessModal component instructed Python to perform SQL operation to create/update process in database, and Python has confirmed completing this instruction)
        if (dqExecutionStatus.status === ExecutionStatus.SUCCESS || dqExecutionStatus.status === ExecutionStatus.FAIL) {
            setExecutionStatus(dqExecutionStatus);
            setDQData((prev) => prev
                ? {
                    ...prev,
                    executionStatus: ExecutionStatus.NONE // Reset the external execution status indicator so that Python knows that instruction was acknowledged
                }
                : null
            );
        }
        else setExecutionStatus((prev) => prev.status === ExecutionStatus.NONE ? prev : { status: ExecutionStatus.NONE }); // Check if execution status is NONE already prior to resetting to avoid infinite re-rendering
    }, [instructions])

    const value: ContextInterface = {
        executionStatus, setExecutionStatus,
        dqdata, setDQData
    }

    return <DQModalDataContext.Provider value={value}>
        {children}
    </DQModalDataContext.Provider>
}