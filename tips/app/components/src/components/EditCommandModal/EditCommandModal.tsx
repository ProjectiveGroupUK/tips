// React
import { useEffect, useState } from "react";

// Contexts
import { useSharedData } from "@/components/reusable/contexts/SharedDataContext";

// Components
import Modal from "@/components/reusable/Modal";
import EditCommandsTable from "./EditCommandsTable";
import FloatingEditButtons from "./FloatingEditButtons";

// Interfaces
import { CommandDataInterface } from "@/interfaces/Interfaces";

// CSS
import styles from "@/styles/processTable/editCommandModal.module.css";

// Icons
import { Search } from 'tabler-icons-react';

export interface FilterCategoryInterface{
    id: string;
    label: string;
    active: boolean;
    propertyIds: Array<keyof CommandDataInterface>;
}

export default function EditCommandModal() {
    const { selectedProcess, selectedCommand, setSelectedCommandId, updateCommand, setUpdateCommand, createCommand, setCreateCommand } = useSharedData();
    const [editedCommandValues, setEditedCommandValues] = useState<CommandDataInterface>((createCommand?.data ?? selectedCommand)!);

    const [filterText, setFilterText] = useState('');
    const [filterCategories, setFilterCategories] = useState<FilterCategoryInterface[]>([
        { id: 'params', label: 'Parameters', active: false, propertyIds: ['CMD_TYPE', 'CMD_WHERE', 'CMD_BINDS'] },
        { id: 'io', label: 'Input & output', active: false, propertyIds: ['CMD_SRC', 'CMD_TGT'] },
        { id: 'merging', label: 'Merging', active: false, propertyIds: ['MERGE_ON_FIELDS', 'GENERATE_MERGE_MATCHED_CLAUSE', 'GENERATE_MERGE_NON_MATCHED_CLAUSE'] },
        { id: 'additional_fields_and_processing', label: 'Additional fields & processing', active: false, propertyIds: ['ADDITIONAL_FIELDS', 'TEMP_TABLE', 'CMD_PIVOT_BY', 'CMD_PIVOT_FIELD'] },
        { id: 'other', label: 'Other', active: false, propertyIds: ['REFRESH_TYPE', 'BUSINESS_KEY', 'DQ_TYPE', 'CMD_EXTERNAL_CALL', 'ACTIVE'] }
    ])
    const [isEditing, setIsEditing] = useState(Boolean(createCommand)); // If user is creating a new command, default isEditing to true

    useEffect(() => { // When updateCommand or createCommand instruction gets cleared by Python (i.e., SQL command execution has finished), set isEditing to false
        if(!updateCommand && !createCommand && isEditing) setIsEditing(false);
    }, [updateCommand, createCommand]);

    function handleCategoryClick(selectedCategoryId: string) {
        setFilterCategories(filterCategories.map((iteratedCategory) => 
            iteratedCategory.id === selectedCategoryId ? 
                { ...iteratedCategory, active: !iteratedCategory.active } 
                : { ...iteratedCategory, active: false }
        ));
    }

    function getEditedProperties(editedCommandValues: CommandDataInterface, selectedCommand: CommandDataInterface) {
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
        setEditedCommandValues(selectedCommand!);
        setCreateCommand(null);
        setIsEditing(false);
    }

    function handleSave() {
        if(createCommand) { // Create new command
            setCreateCommand((prevState) => ({
                ...prevState!,
                data: editedCommandValues,
                processing: true
            }))
        }
        else { // Update existing command
            const editedProperties = getEditedProperties(editedCommandValues, selectedCommand!);
            if(Object.keys(editedProperties).length === 0) { // No changes have been made to command
                setIsEditing(false);
                return;
            }
            setUpdateCommand(editedProperties);
        }      
    }

    function handleCloseModal() {
        setSelectedCommandId(null);
        setCreateCommand(null);
    }


    const process = createCommand?.process ?? selectedProcess;
    const command = createCommand?.data ?? selectedCommand;
    const processing = createCommand ? createCommand.processing : (updateCommand !== null);

    return(
        <Modal
            isOpen={Boolean(command)}
            onFadeOutComplete={handleCloseModal}
            noPadding={true}
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1>{ createCommand ? 'New command' : `Command ${command?.PROCESS_CMD_ID}` }</h1>
                        <h2>In the {process?.name} process</h2>
                    </div>
                    <div className={styles.separator} />
                    <div className={styles.headerRight} data-active-status={command?.ACTIVE}>
                        {command?.ACTIVE === 'Y' ? 'Active' : 'Inactive'}
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
                            selectedCommand={command ?? {} as CommandDataInterface}
                            editedCommandValues={editedCommandValues}
                            setEditedCommandValues={setEditedCommandValues}
                            filterText={filterText}
                            filterCategories={filterCategories}
                            isEditing={isEditing}
                        />
                        
                    </div>
                </div>
            </div>

            <FloatingEditButtons
                type={createCommand ? 'create' : 'edit'}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                isSaving={processing}
                onCancel={handleCancel}
                onSave={handleSave}
            />
        </Modal>
    );
}