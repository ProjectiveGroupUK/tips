// React
import { useState, useEffect } from "react";

// Contexts
import { useSharedData } from "@/components/reusable/contexts/SharedDataContext";

// Components
import Modal from "@/components/reusable/Modal";

// CSS
import styles from "@/styles/processTable/editCommandModal.module.css";

export default function EditCommandModal() {
    const { selectedProcess, selectedCommand, setSelectedCommandId } = useSharedData();
    
    // Create a 'command' state variable which duplicates data from 'selectedCommand', but temporarily persists the data even is 'selectedCommand' is set to null and modal starts fading out (to prevent the modal from flashing the 'undefined' values)
    const [command, setCommand] = useState(selectedCommand);
    useEffect(() => { if(selectedCommand) setCommand(selectedCommand); }, [selectedCommand]);

    return(
        <Modal
            isOpen={selectedCommand !== null}
            onFadeOutComplete={() => setSelectedCommandId(null)}
            noPadding={true}
        >
            <>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <h1>Command {command?.PROCESS_CMD_ID}</h1>
                            <h2>From the {selectedProcess?.name} process</h2>
                        </div>
                        <div className={styles.separator} />
                        <div className={styles.headerRight} data-active-status={command?.ACTIVE}>
                            {command?.ACTIVE === 'Y' ? 'Active' : 'Inactive'}
                        </div>
                    </div>
                    <div className={styles.configContainer}>
                        <div className={styles.verticalBar} />
                        <div className={styles.configFields}>
                            <FieldPair label='Type' value={command?.CMD_TYPE} />
                            <FieldPair label='Source' value={command?.CMD_SRC} />
                            <FieldPair label='Target' value={command?.CMD_TGT} />
                            <FieldPair label='Where' value={command?.CMD_WHERE} />
                            <FieldPair label='Binds' value={command?.CMD_BINDS} />
                            <FieldPair label='Refresh type' value={command?.REFRESH_TYPE} />
                            <FieldPair label='Business key' value={command?.BUSINESS_KEY} />
                            <FieldPair label='Merge on fields' value={command?.MERGE_ON_FIELDS} />
                            <FieldPair label='Generate merge matched clause' value={command?.GENERATE_MERGE_MATCHED_CLAUSE} />
                            <FieldPair label='Generate merge non matched clause' value={command?.GENERATE_MERGE_NON_MATCHED_CLAUSE} />
                            <FieldPair label='Additional fields' value={command?.ADDITIONAL_FIELDS} />
                            <FieldPair label='Temp table' value={command?.TEMP_TABLE} />
                            <FieldPair label='Pivot by' value={command?.CMD_PIVOT_BY} />
                            <FieldPair label='Pivot field' value={command?.CMD_PIVOT_FIELD} />
                            <FieldPair label='DQ type' value={command?.DQ_TYPE} />
                            <FieldPair label='DQ type' value={command?.DQ_TYPE} />
                            <FieldPair label='External call' value={command?.CMD_EXTERNAL_CALL} />
                            <FieldPair label='Active' value={command?.ACTIVE} />
                        </div>
                    </div>
                </div>

                <FloatingEditButton />
            </>
        </Modal>
    );
}

interface FieldPairPropsInterface {
    label: string;
    value: any;
}

function FieldPair({ label, value }: FieldPairPropsInterface) {
    return(
        <div className={styles.fieldPair}>
            <div className={styles.fieldLabel}>{label}</div>
            <div className={styles.fieldValue}>{value}</div>
        </div>
    );
}

function FloatingEditButton() {
    return(
        <div className={styles.editButtonContainer}>
            <button>Edit</button>
        </div>
    );
}