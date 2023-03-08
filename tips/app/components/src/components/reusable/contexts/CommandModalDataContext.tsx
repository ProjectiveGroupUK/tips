// React
import { createContext, useContext, useState, useEffect } from 'react';

// Streamlit
import { Streamlit } from 'streamlit-component-lib';

// Interfaces
import { ProcessDataInterface, CommandDataInterface } from '@/interfaces/Interfaces';
import { PropsInterface_CommandModal } from '@/App';

// Enums
import { ExecutionStatus } from '@/enums/enums';

const CommandModalDataContext = createContext<ContextInterface>(undefined!);

interface ContextInterface {
    executionStatus: ExecutionStatusInterface;
    setExecutionStatus: React.Dispatch<React.SetStateAction<ExecutionStatusInterface>>;
    command: CommandInterface | null;
    setCommand: React.Dispatch<React.SetStateAction<CommandInterface | null>>;
}

interface ExecutionStatusInterface {
    status: ExecutionStatus;
    createdCommandId?: number | undefined;
};

interface CommandInterface {
    operation: {
        type: 'create' | 'edit';
    }
    process: ProcessDataInterface[0];
    command: Partial<CommandDataInterface> | null;
    executionStatus: {
      status: ExecutionStatus;
      createdCommandId?: number | undefined;
    };
}

export function useCommandModalData() {
    return useContext(CommandModalDataContext);
}

export default function CommandModalDataContextProvider({ commandData: receivedCommandData, instructions, children }: PropsInterface_CommandModal & { children: React.ReactNode }) {
    const [executionStatus, setExecutionStatus] = useState<ExecutionStatusInterface>({ status: ExecutionStatus.NONE });
    const [command, setCommand] = useState<CommandInterface | null>(receivedCommandData ? receivedCommandData : null);

    useEffect(() => { // Update Streamlit when any of the values in the context change
        Streamlit.setComponentValue(getObjectWithoutFunctions(value));
    }, [executionStatus, command]);

    useEffect(() => { // Interpret and act upon instructions sent from Python
        const { commandExecutionStatus } = instructions;

        // Reset command processing indicator and temporarily store executing status (would be instructed if CommandModal component instructed Python to perform SQL operation to create/update command in database, and Python has confirmed completing this instruction)
        if(commandExecutionStatus === ExecutionStatus.SUCCESS || commandExecutionStatus === ExecutionStatus.FAIL) {
            setExecutionStatus({ status: commandExecutionStatus });
            setCommand((prev) => prev
                ? {
                    ...prev,
                    executionStatus: { status: ExecutionStatus.NONE } // Reset the external execution status indicator so that Python knows that instruction was acknowledged
                } 
                : null
            );
        }
        else setExecutionStatus((prevState) => { // Reset execution status if neither execution status variables is assigned
            const newExecutionStatus = { status: ExecutionStatus.NONE }
            if(JSON.stringify(prevState) === JSON.stringify(newExecutionStatus)) return prevState; // If object contents were the same, return previous object to prevent infinite re-rendering
            return newExecutionStatus;
        })
    }, [instructions])

    const value: ContextInterface = {
        executionStatus, setExecutionStatus,
        command, setCommand
    };

    return (
        <CommandModalDataContext.Provider value={value}>
            {children}
        </CommandModalDataContext.Provider>
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