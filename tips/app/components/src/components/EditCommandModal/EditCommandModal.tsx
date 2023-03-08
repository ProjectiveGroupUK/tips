// React
import { useEffect, useState } from "react";

// Framer motion
import { AnimatePresence, motion } from "framer-motion";

// Contexts
import { useCommandModalData } from "@/components/reusable/contexts/CommandModalDataContext";

// Components
import Modal from "@/components/reusable/Modal";
import EditCommandsTable from "./EditCommandsTable";
import FloatingEditButtons from "./FloatingEditButtons";

// Interfaces
import { CommandDataInterface } from "@/interfaces/Interfaces";

// Enums
import { ExecutionStatus } from "@/enums/enums";

// CSS
import styles from "@/styles/processTable/editCommandModal.module.css";

// Icons
import { Search, CircleCheck, AlertCircle } from 'tabler-icons-react';

export interface FilterCategoryInterface{
    id: string;
    label: string;
    active: boolean;
    propertyIds: Array<keyof CommandDataInterface>;
}

export default function EditCommandModal() {

    const { command, setCommand, executionStatus } = useCommandModalData();
    const [editedCommandValues, setEditedCommandValues] = useState<Partial<CommandDataInterface>>(command?.command!);
    const [showExecutionStatusMessage, setShowExecutionStatusMessage] = useState(ExecutionStatus.NONE);

    const [filterText, setFilterText] = useState('');
    const [filterCategories, setFilterCategories] = useState<FilterCategoryInterface[]>([
        { id: 'params', label: 'Parameters', active: false, propertyIds: ['CMD_TYPE', 'CMD_WHERE', 'CMD_BINDS'] },
        { id: 'io', label: 'Input & output', active: false, propertyIds: ['CMD_SRC', 'CMD_TGT'] },
        { id: 'merging', label: 'Merging', active: false, propertyIds: ['MERGE_ON_FIELDS', 'GENERATE_MERGE_MATCHED_CLAUSE', 'GENERATE_MERGE_NON_MATCHED_CLAUSE'] },
        { id: 'additional_fields_and_processing', label: 'Additional fields & processing', active: false, propertyIds: ['ADDITIONAL_FIELDS', 'TEMP_TABLE', 'CMD_PIVOT_BY', 'CMD_PIVOT_FIELD'] },
        { id: 'other', label: 'Other', active: false, propertyIds: ['REFRESH_TYPE', 'BUSINESS_KEY', 'DQ_TYPE', 'CMD_EXTERNAL_CALL', 'ACTIVE'] }
    ])
    const [isEditing, setIsEditing] = useState(Boolean(command?.operation.type === 'create')); // If user is creating a new command, default isEditing to true

    useEffect(() => { // When Python sends notification about execution of SQL instruction, show message to user for 3 seconds
        if([ExecutionStatus.SUCCESS, ExecutionStatus.FAIL].includes(executionStatus.status)) {
            setShowExecutionStatusMessage(executionStatus.status);
            setTimeout(() => {
                setShowExecutionStatusMessage(ExecutionStatus.NONE);
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
        if(command?.operation.type === 'edit') { // If user is saving an edited version of existing command, ensure that actual changes have been made prior to requesting SQL execution
            const editedProperties = getEditedProperties(editedCommandValues!, command.command!);
            if(Object.keys(editedProperties).length === 0) { // No changes have been made to command
                return;
            }
        }

        setCommand((prevState) => ({
            ...prevState!,
            command: editedCommandValues,
            executionStatus: {
                status: ExecutionStatus.RUNNING
            }
        }));
    }

    function handleCloseModal() {
        setCommand(null)
    }

    const processing = Boolean(command?.executionStatus.status === ExecutionStatus.RUNNING);

    return(
        <Modal
            isOpen={Boolean(command)}
            onFadeOutComplete={handleCloseModal}
            noPadding={true}
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1>{ command?.operation.type === 'create' ? 'New command' : `Command ${command?.command?.PROCESS_CMD_ID}` }</h1>
                        <h2>In the {command?.process.name} process</h2>
                    </div>
                    <div className={styles.separator} />
                    <div className={styles.headerRight} data-active-status={command?.command?.ACTIVE}>
                        {command?.command?.ACTIVE === 'Y' ? 'Active' : 'Inactive'}
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
                        <EditCommandsTable
                            selectedCommand={command?.command ?? {} as Partial<CommandDataInterface>}
                            editedCommandValues={editedCommandValues!}
                            setEditedCommandValues={setEditedCommandValues}
                            filterText={filterText}
                            filterCategories={filterCategories}
                            isEditing={isEditing}
                        />
                        
                    </div>
                </div>

                {/* Execution status message */}
                <AnimatePresence>
                { [ExecutionStatus.SUCCESS, ExecutionStatus.FAIL].includes(showExecutionStatusMessage) && (
                    <motion.div 
                        className={styles.executionStatusMessageContainer}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div>
                            {/* Icon */}
                            { showExecutionStatusMessage === ExecutionStatus.SUCCESS
                                ? <CircleCheck size={40} color='var(--success-green-light)' />
                                : <AlertCircle size={40} color='var(--fail-red-light)' />
                            }

                            {/* Text */}
                            { showExecutionStatusMessage === ExecutionStatus.SUCCESS
                                ? <div>Command { command?.operation.type === 'create' ? 'created' : 'updated' } <span className={styles.executionSuccess}>sucessfully</span></div>
                                : <div><span className={styles.executionFail}>Failed</span> to { command?.operation.type === 'create' ? 'create' : 'update' } command</div>
                            }
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>

            <FloatingEditButtons
                type={command?.operation.type === 'create' ? 'create' : 'edit'}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                isSaving={processing}
                onCancel={handleCancel}
                onSave={handleSave}
            />
        </Modal>
    );
}