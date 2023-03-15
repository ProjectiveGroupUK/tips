// React
import { useEffect, useState } from "react";

// Framer motion
import { AnimatePresence, motion } from "framer-motion";

// React-spinners
import { ClipLoader } from "react-spinners";

// Contexts
import { useCommandModalData } from "@/contexts/CommandModalDataContext";

// Components
import Modal from "@/components/reusable/Modal";
import CommandModalTable from "./CommandModalTable";
import FloatingEditButtons from "@/components/reusable/FloatingEditButtons";

// Interfaces
import { CommandDataInterface, ExecutionStatusInterface } from "@/interfaces/Interfaces";

// Enums
import { ExecutionStatus, OperationType } from "@/enums/enums";

// CSS
import styles from "@/styles/CommandModal/CommandModal.module.css";

// Icons
import { Search, CircleCheck, AlertCircle } from 'tabler-icons-react';

export interface FilterCategoryInterface{
    id: string;
    label: string;
    active: boolean;
    propertyIds: Array<keyof CommandDataInterface>;
}

export default function CommandModal() {

    const { executionStatus, command, setCommand } = useCommandModalData();
    const [originalCommandData, setOriginalCommandData] = useState(command?.command!); // Stores command as it was prior to saving -> allows table cells to determine which cells have been edited and display PulseLoader only on relevant fields while saving operation is in progress
    const [showExecutionStatusMessage, setShowExecutionStatusMessage] = useState<ExecutionStatusInterface>({ status: ExecutionStatus.NONE });
    const [editedCommandValues, setEditedCommandValues] = useState<Partial<CommandDataInterface>>(command?.command!);

    const [filterText, setFilterText] = useState('');
    const [filterCategories, setFilterCategories] = useState<FilterCategoryInterface[]>([
        { id: 'params', label: 'Parameters', active: false, propertyIds: ['CMD_TYPE', 'CMD_WHERE', 'CMD_BINDS'] },
        { id: 'io', label: 'Input & output', active: false, propertyIds: ['CMD_SRC', 'CMD_TGT'] },
        { id: 'merging', label: 'Merging', active: false, propertyIds: ['MERGE_ON_FIELDS', 'GENERATE_MERGE_MATCHED_CLAUSE', 'GENERATE_MERGE_NON_MATCHED_CLAUSE'] },
        { id: 'additional_fields_and_processing', label: 'Additional fields & processing', active: false, propertyIds: ['ADDITIONAL_FIELDS', 'TEMP_TABLE', 'CMD_PIVOT_BY', 'CMD_PIVOT_FIELD'] },
        { id: 'other', label: 'Other', active: false, propertyIds: ['REFRESH_TYPE', 'BUSINESS_KEY', 'DQ_TYPE', 'CMD_EXTERNAL_CALL'] }
    ])
    const [isEditing, setIsEditing] = useState(Boolean(command?.operation.type === 'create')); // If user is creating a new command, default isEditing to true

    useEffect(() => { // When Python sends notification about execution of SQL instruction, show message to user for 3 seconds
        if(executionStatus.status === ExecutionStatus.SUCCESS || executionStatus.status === ExecutionStatus.FAIL) {
            setShowExecutionStatusMessage(executionStatus);
            setTimeout(() => {
                setShowExecutionStatusMessage({ status: ExecutionStatus.NONE });
                if(executionStatus.operationType === OperationType.DELETE && executionStatus.status === ExecutionStatus.SUCCESS) handleCloseModal();
            }, 3000);
        }
    }, [executionStatus]);

    function handleCategoryClick(selectedCategoryId: string) {
        setFilterCategories(filterCategories.map((iteratedCategory) => 
            iteratedCategory.id === selectedCategoryId ? 
                { ...iteratedCategory, active: !iteratedCategory.active } 
                : { ...iteratedCategory, active: false }
        ));
    }

    function getEditedProperties(editedCommandValues: Partial<CommandDataInterface>, selectedCommand: Partial<CommandDataInterface>) {
        const editedProperties: {
            [propertyName in keyof CommandDataInterface]?: CommandDataInterface[propertyName]
        } = Object.entries(editedCommandValues).reduce((accumulator, [_commandProperty, _commandValue]) => {
            const commandProperty = _commandProperty as keyof CommandDataInterface;
            const commandValue = _commandValue as CommandDataInterface[keyof CommandDataInterface];
            const propertyHasChanged = commandValue !== selectedCommand[commandProperty];

            if(propertyHasChanged) return { ...accumulator, [commandProperty]: commandValue };
            return accumulator;
        }, {});

        return editedProperties;
    }

    function handleCancel() {
        setEditedCommandValues(command?.command!);
        setIsEditing(false);
    }

    function handleSave() {
        setIsEditing(false);
        if(command?.operation.type === OperationType.EDIT) { // If user is saving an edited version of existing command, ensure that actual changes have been made prior to requesting SQL execution
            const editedProperties = getEditedProperties(editedCommandValues!, command.command!);
            if(Object.keys(editedProperties).length === 0) { // No changes have been made to command
                return;
            }
        }

        setCommand((prevState) => {

            setOriginalCommandData(prevState?.command!)

            return {
                ...prevState!,
                command: editedCommandValues,
                executionStatus: ExecutionStatus.RUNNING
            }
        });
    }

    function handleDelete() {
        setCommand((prevState) => ({
            ...prevState!,
            operation: {
                type: OperationType.DELETE
            },
            executionStatus: ExecutionStatus.RUNNING
        }));
    }

    function handleCloseModal() {
        setCommand(null)
    }

    function toggleCommandStatus() {
        setEditedCommandValues((prevState) => ({
            ...prevState,
            ACTIVE: prevState.ACTIVE === 'Y' ? 'N' : 'Y'
        }));
    }

    const processing = Boolean(command?.executionStatus === ExecutionStatus.RUNNING);

    const executionStatusMessage: { [key in OperationType]: { [status in ExecutionStatus.SUCCESS | ExecutionStatus.FAIL]: string } } = {
        [OperationType.CREATE]: {
            [ExecutionStatus.SUCCESS]: 'Command created successfully',
            [ExecutionStatus.FAIL]: 'Failed to create command'
        },
        [OperationType.EDIT]: {
            [ExecutionStatus.SUCCESS]: 'Command updated successfully',
            [ExecutionStatus.FAIL]: 'Failed to update command'
        },
        [OperationType.DELETE]: {
            [ExecutionStatus.SUCCESS]: 'Command deleted successfully',
            [ExecutionStatus.FAIL]: 'Failed to delete command'
        }
    };

    return (
        <Modal
            isOpen={Boolean(command)}
            onFadeOutComplete={handleCloseModal}
            noPadding
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1>{ command?.operation.type === OperationType.CREATE ? 'New command' : `Command ${command?.command?.PROCESS_CMD_ID}` }</h1>
                        <h2>In the {command?.process.PROCESS_NAME} process</h2>
                    </div>
                    <div className={styles.separator} />
                    <div className={styles.headerRight} data-active-status={(isEditing ? editedCommandValues : command?.command)?.ACTIVE == 'Y'}>

                        {/* Status label */}
                        <motion.div layout>
                            {(isEditing ? editedCommandValues : command?.command)?.ACTIVE === 'Y' ? 'Active' : 'Inactive'}
                        </motion.div>

                        {/* Toggle status button/spinner */}
                        <AnimatePresence mode='popLayout'>

                            {/* Button */}
                            { isEditing && (
                                <motion.button
                                    onClick={toggleCommandStatus}
                                    disabled={processing}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }} 
                                    exit={{ opacity: 0 }}
                                >
                                    {editedCommandValues?.ACTIVE === 'Y' ? 'Disable' : 'Enable'}
                                </motion.button>
                            )}

                            {/* Spinner */}
                            { processing && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }} 
                                    exit={{ opacity: 0 }}
                                >
                                    <ClipLoader size={16} color='var(--primary)' />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <div className={styles.configContainer}>
                    <div className={styles.verticalBar} />

                    <div className={styles.configParent}>

                        {/* Header */}
                        <div className={styles.configHeader}>

                            {/* Search box */}
                            <div className={`${styles.searchBox} ${filterText.length && styles.active}`}>
                                <Search size={15} strokeWidth={2} color='var(--primary)' />
                                <input className={styles.searchInput} value={filterText} onChange={(e) => setFilterText(e.target.value)} />
                            </div>

                            {/* Category selection */}
                            <div className={styles.categorySelector}>
                            { filterCategories.map((category) => (
                                <button 
                                    key={category.id}
                                    className={`${styles.categoryItem} ${category.active && styles.active}`}
                                    onClick={() => handleCategoryClick(category.id)}
                                >
                                    {category.label}
                                </button>
                            ))}
                            </div>
                        </div>

                        { /* Table */}
                        <CommandModalTable
                            originalCommandData={originalCommandData}
                            editedCommandValues={editedCommandValues!}
                            setEditedCommandValues={setEditedCommandValues}
                            filterText={filterText}
                            filterCategories={filterCategories}
                            isEditing={isEditing}
                            isProcessing={processing}
                        />
                        
                    </div>
                </div>

                {/* Execution status message */}
                <AnimatePresence>
                { (showExecutionStatusMessage.status === ExecutionStatus.SUCCESS || showExecutionStatusMessage.status === ExecutionStatus.FAIL) && (
                    <motion.div 
                        className={styles.executionStatusMessageContainer}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div>
                            {/* Icon */}
                            { showExecutionStatusMessage.status === ExecutionStatus.SUCCESS
                                ? <CircleCheck size={40} color='var(--success-green-light)' />
                                : <AlertCircle size={40} color='var(--fail-red-light)' />
                            }

                            {/* Text */}
                            { executionStatusMessage[showExecutionStatusMessage.operationType][showExecutionStatusMessage.status] }
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>

            <FloatingEditButtons
                type={command?.operation.type === OperationType.CREATE ? 'create' : 'edit'}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                allowDelete={command?.operation.type === OperationType.EDIT}
                isSaving={processing}
                onCancel={handleCancel}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </Modal>
    );
}