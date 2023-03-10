// React
import { createContext, useContext, useState, useEffect } from 'react';

// Streamlit
import { Streamlit } from 'streamlit-component-lib';

// Interfaces
import { ProcessDataInterface, CommandDataInterface, ExecutionStatusInterface } from '@/interfaces/Interfaces';
import { PropsInterface_CommandModal } from '@/App';

// Enums
import { ExecutionStatus, OperationType } from '@/enums/enums';

const CommandModalDataContext = createContext<ContextInterface>(undefined!);

interface ContextInterface {
    executionStatus: ExecutionStatusInterface; // Internal (react) use only
    setExecutionStatus: React.Dispatch<React.SetStateAction<ExecutionStatusInterface>>; // Internal (react) use only
    command: CommandInterface | null;
    setCommand: React.Dispatch<React.SetStateAction<CommandInterface | null>>;
}

interface CommandInterface {
    operation: {
        type: OperationType;
    }
    process: ProcessDataInterface;
    command: Partial<CommandDataInterface> | null;
    executionStatus: ExecutionStatus;
}

export function useCommandModalData() {
    return useContext(CommandModalDataContext);
}

export default function CommandModalDataContextProvider({ commandData: receivedCommandData, instructions, children }: PropsInterface_CommandModal & { children: React.ReactNode }) {
    const [executionStatus, setExecutionStatus] = useState<ExecutionStatusInterface>({ status: ExecutionStatus.NONE });
    const [command, setCommand] = useState<CommandInterface | null>(receivedCommandData ? { ...receivedCommandData, executionStatus: ExecutionStatus.NONE } : null);

    useEffect(() => { // Update Streamlit when any of the values in the context change
        Streamlit.setComponentValue(getObjectWithoutFunctions(value));
    }, [command]);

    if(command !== null && ((receivedCommandData.command?.PROCESS_CMD_ID !== command?.command?.PROCESS_CMD_ID) || (receivedCommandData.operation.type !== command?.operation.type))) { // Update command if receivedCommandData has updated and is pushing override of PROCESS_CMD_ID and/or operation type (happens when new command has just been created and Python instructs react to render the new command in editing mode)
        setCommand((prev) => prev 
            ? ({
                ...prev, 
                command: {
                    ...prev.command,
                    PROCESS_CMD_ID: receivedCommandData.command?.PROCESS_CMD_ID
                },
                operation: {
                    ...prev!.operation,
                    type: receivedCommandData.operation.type
                }
            })
            : null
        );
    }

    useEffect(() => { // Interpret and act upon instructions sent from Python
        const { commandExecutionStatus } = instructions;

        // Reset command processing indicator and temporarily store executing status (would be instructed if CommandModal component instructed Python to perform SQL operation to create/update command in database, and Python has confirmed completing this instruction)
        if(commandExecutionStatus.status === ExecutionStatus.SUCCESS || commandExecutionStatus.status === ExecutionStatus.FAIL) {
            setExecutionStatus(commandExecutionStatus);
            setCommand((prev) => prev
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