// React
import { createContext, useContext, useState, useEffect } from 'react';

// Streamlit
import { Streamlit } from 'streamlit-component-lib';

// Supporting functions
import { getObjectWithoutFunctions } from '@/supportingFunctions/getObjectWithoutFunctions';

// Interfaces
import { PropsInterface_DQTargetModal } from '@/App';
import { DQDataInterface, DQTargetDataInterface, ExecutionStatusInterface } from '@/interfaces/Interfaces';

// Enums
import { ExecutionStatus, OperationType } from '@/enums/enums';

const DQTargetModalDataContext = createContext<ContextInterface>(undefined!);

interface ContextInterface {
    executionStatus: ExecutionStatusInterface; // Internal (react) use only
    setExecutionStatus: React.Dispatch<React.SetStateAction<ExecutionStatusInterface>>; // Internal (react) use only
    dqtarget: DQTargetInterface | null;
    setDQTarget: React.Dispatch<React.SetStateAction<DQTargetInterface | null>>;
}

interface DQTargetInterface {
    operation: {
        type: OperationType;
    }
    dqdata: DQDataInterface;
    dqtarget: Partial<DQTargetDataInterface> | null;
    executionStatus: ExecutionStatus;
}

export function useDQTargetModalData() {
    return useContext(DQTargetModalDataContext);
}

export default function DQTargetModalDataContextProvider({ dqtargetdata: receivedDQtargetData, instructions, children }: PropsInterface_DQTargetModal & { children: React.ReactNode }) {
    const [executionStatus, setExecutionStatus] = useState<ExecutionStatusInterface>({ status: ExecutionStatus.NONE });
    const [dqtarget, setDQTarget] = useState<DQTargetInterface | null>(receivedDQtargetData ? { ...receivedDQtargetData, executionStatus: ExecutionStatus.NONE } : null)

    useEffect(() => { // Update Streamlit when any of the values in the context change
        Streamlit.setComponentValue(getObjectWithoutFunctions(value));
    }, [dqtarget]);

    if (dqtarget !== null && ((receivedDQtargetData.dqtarget?.PROCESS_CMD_TGT_DQ_TEST_ID !== dqtarget.dqtarget?.PROCESS_CMD_TGT_DQ_TEST_ID))) { // Update process if receivedProcessData has updated and is pushing override of id (happens when new process has just been created and Python instructs react to render the new process in editing mode)
        setDQTarget((prev) => prev
            ? ({
                ...prev,
                dqtarget: {
                    ...prev.dqtarget,
                    PROCESS_CMD_TGT_DQ_TEST_ID: receivedDQtargetData.dqtarget?.PROCESS_CMD_TGT_DQ_TEST_ID
                },
                operation: {
                    ...prev.operation,
                    type: receivedDQtargetData.operation.type
                }
            })
            : null
        );
    }

    useEffect(() => { // Interpret and act upon instructions sent from Python
        const { dqTargetExecutionStatus } = instructions;

        // Reset process processing indicator and temporarily store executing status (would be instructed if ProcessModal component instructed Python to perform SQL operation to create/update process in database, and Python has confirmed completing this instruction)
        if (dqTargetExecutionStatus.status === ExecutionStatus.SUCCESS || dqTargetExecutionStatus.status === ExecutionStatus.FAIL) {
            setExecutionStatus(dqTargetExecutionStatus);
            setDQTarget((prev) => prev
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
        dqtarget, setDQTarget
    }

    return <DQTargetModalDataContext.Provider value={value}>
        {children}
    </DQTargetModalDataContext.Provider>
}