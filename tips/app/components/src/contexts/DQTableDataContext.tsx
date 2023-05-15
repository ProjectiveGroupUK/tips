// React
import { createContext, useContext, useState, useEffect } from 'react';

// Streamlit
import { Streamlit } from 'streamlit-component-lib';

// Supporting functions
import { getObjectWithoutFunctions } from '@/supportingFunctions/getObjectWithoutFunctions';

// Interfaces
import { DQDataInterface, DQTargetDataInterface } from '@/interfaces/Interfaces';
import { PropsInterface_DQTable } from '@/App';

// Enums
import { ExecutionStatus, OperationType } from '@/enums/enums';

const DQTableDataContext = createContext<ContextInterface>(undefined!);

interface ContextInterface {
    dqData: DQDataInterface[];
    editedDQData: EditedDQInterface | null;
    setEditedDQData: React.Dispatch<React.SetStateAction<EditedDQInterface | null>>;
    dqTargetData: DQTargetInterface | null;
    setDQTargetData: React.Dispatch<React.SetStateAction<DQTargetInterface | null>>;
}

interface EditedDQInterface {
    operation: {
        type: OperationType;
    }
    dqdata: DQDataInterface;
    executionStatus: ExecutionStatus;
}

interface DQTargetInterface {
    operation: {
        type: OperationType;
    }
    dqdata: DQDataInterface;
    dqtarget: DQTargetDataInterface | null;
    executionStatus: ExecutionStatus;
}

export function useDQTableData() {
    return useContext(DQTableDataContext);
}

export default function DQTableDataContextProvider({ dqdata: receivedDQData, instructions, children }: PropsInterface_DQTable & { children: React.ReactNode }) {
    const [dqData, setDQData] = useState<DQDataInterface[]>(receivedDQData ?? []);
    const [editedDQData, setEditedDQData] = useState<EditedDQInterface | null>(null);
    const [dqTargetData, setDQTargetData] = useState<DQTargetInterface | null>(null);

    useEffect(() => { // Update Streamlit when any of the values in the context change
        Streamlit.setComponentValue(getObjectWithoutFunctions(value));
    }, [dqTargetData, editedDQData]);

    if (JSON.stringify(receivedDQData ?? []) !== JSON.stringify(dqData)) { // Update processData variable when prop passed down from Python updates (useEffect hook does not fire when prop updates)
        setDQData(receivedDQData ?? []);
    }

    useEffect(() => { // Interpret and act upon instructions sent from Python
        const { resetDQTableDQTest, resetDQTableTarget } = instructions;
        if (resetDQTableDQTest) setEditedDQData(null); // Reset edited process (would be instructed if ProcessModal component was closed)
        if (resetDQTableTarget) setDQTargetData(null); // Reset command (would be instructed if CommandMOdal component was closed)        
    }, [instructions]);

    const value: ContextInterface = {
        dqData,
        editedDQData, setEditedDQData,
        dqTargetData, setDQTargetData
    };

    return (
        <DQTableDataContext.Provider value={value}>
            {children}
        </DQTableDataContext.Provider>
    )
}