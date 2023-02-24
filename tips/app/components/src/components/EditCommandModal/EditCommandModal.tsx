// React
import { useState } from "react";

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
    const { selectedProcess, selectedCommand, setSelectedCommandId } = useSharedData();

    const [filterText, setFilterText] = useState('');
    const [filterCategories, setFilterCategories] = useState<FilterCategoryInterface[]>([
        { id: 'params', label: 'Parameters', active: false, propertyIds: ['CMD_TYPE', 'CMD_WHERE', 'CMD_BINDS'] },
        { id: 'io', label: 'Input & output', active: false, propertyIds: ['CMD_SRC', 'CMD_TGT'] },
        { id: 'merging', label: 'Merging', active: false, propertyIds: ['MERGE_ON_FIELDS', 'GENERATE_MERGE_MATCHED_CLAUSE', 'GENERATE_MERGE_NON_MATCHED_CLAUSE'] },
        { id: 'additional_fields_and_processing', label: 'Additional fields & processing', active: false, propertyIds: ['ADDITIONAL_FIELDS', 'TEMP_TABLE', 'CMD_PIVOT_BY', 'CMD_PIVOT_FIELD'] },
        { id: 'other', label: 'Other', active: false, propertyIds: ['REFRESH_TYPE', 'BUSINESS_KEY', 'DQ_TYPE', 'CMD_EXTERNAL_CALL', 'ACTIVE'] }
    ])
    const [isEditing, setIsEditing] = useState(false);

    function handleCategoryClick(selectedCategoryId: string) {
        setFilterCategories(filterCategories.map((iteratedCategory) => 
            iteratedCategory.id === selectedCategoryId ? 
                { ...iteratedCategory, active: !iteratedCategory.active } 
                : { ...iteratedCategory, active: false }
        ));
    }

    return(
        <Modal
            isOpen={selectedCommand !== null}
            onFadeOutComplete={() => setSelectedCommandId(null)}
            noPadding={true}
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1>Command {selectedCommand?.PROCESS_CMD_ID}</h1>
                        <h2>From the {selectedProcess?.name} process</h2>
                    </div>
                    <div className={styles.separator} />
                    <div className={styles.headerRight} data-active-status={selectedCommand?.ACTIVE}>
                        {selectedCommand?.ACTIVE === 'Y' ? 'Active' : 'Inactive'}
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

                        { /* Tables */}
                        <EditCommandsTable
                            filterText={filterText}
                            filterCategories={filterCategories}
                            isEditing={isEditing}
                        />
                        
                    </div>
                </div>
            </div>

            <FloatingEditButtons
                isEditing={isEditing}
                setIsEditing={setIsEditing}
            />
        </Modal>
    );
}