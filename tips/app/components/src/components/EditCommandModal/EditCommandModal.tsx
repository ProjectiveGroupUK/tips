// React
import { useState } from "react";

// Framer motion
import { AnimatePresence, motion } from "framer-motion";

// Contexts
import { useSharedData } from "@/components/reusable/contexts/SharedDataContext";

// Components
import Modal from "@/components/reusable/Modal";

// CSS
import styles from "@/styles/processTable/editCommandModal.module.css";

export default function EditCommandModal() {
    const { selectedProcess, selectedCommand, setSelectedCommandId } = useSharedData();

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
                        <div className={styles.configFields}>
                            <FieldPair label='Type' value={selectedCommand?.CMD_TYPE} />
                            <FieldPair label='Source' value={selectedCommand?.CMD_SRC} />
                            <FieldPair label='Target' value={selectedCommand?.CMD_TGT} />
                            <FieldPair label='Where' value={selectedCommand?.CMD_WHERE} />
                            <FieldPair label='Binds' value={selectedCommand?.CMD_BINDS} />
                            <FieldPair label='Refresh type' value={selectedCommand?.REFRESH_TYPE} />
                            <FieldPair label='Business key' value={selectedCommand?.BUSINESS_KEY} />
                            <FieldPair label='Merge on fields' value={selectedCommand?.MERGE_ON_FIELDS} />
                            <FieldPair label='Generate merge matched clause' value={selectedCommand?.GENERATE_MERGE_MATCHED_CLAUSE} />
                            <FieldPair label='Generate merge non matched clause' value={selectedCommand?.GENERATE_MERGE_NON_MATCHED_CLAUSE} />
                            <FieldPair label='Additional fields' value={selectedCommand?.ADDITIONAL_FIELDS} />
                            <FieldPair label='Temp table' value={selectedCommand?.TEMP_TABLE} />
                            <FieldPair label='Pivot by' value={selectedCommand?.CMD_PIVOT_BY} />
                            <FieldPair label='Pivot field' value={selectedCommand?.CMD_PIVOT_FIELD} />
                            <FieldPair label='DQ type' value={selectedCommand?.DQ_TYPE} />
                            <FieldPair label='DQ type' value={selectedCommand?.DQ_TYPE} />
                            <FieldPair label='External call' value={selectedCommand?.CMD_EXTERNAL_CALL} />
                            <FieldPair label='Active' value={selectedCommand?.ACTIVE} />
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
    const [editing, setEditing] = useState(false);

    return(
        <div className={styles.editButtonContainer}>

            <motion.button
                layout
                className={ editing ? styles.button_cancel : styles.button_edit}
                onClick={() => setEditing((prev) => !prev)}
            >
                { editing ? 'Cancel' : 'Edit' }
            </motion.button>
            <AnimatePresence mode='popLayout'>
                { editing && (
                    <motion.button
                        layout
                        className={styles.button_save}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                    >
                        Save
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}