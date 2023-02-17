// React
import { useState, useEffect } from "react";

// Contexts
import { useProcessData } from "@/components/ProcessTable/contexts/ProcessDataContext";

// Components
import Modal from "@/components/reusable/Modal";

// CSS
import styles from "@/styles/editCommandModal.module.css";

export default function EditCommandModal() {
    const { selectedProcess, selectedCommand, setSelectedCommandId } = useProcessData();
    
    // Create a 'command' state variable which duplicates data from 'selectedCommand', but temporarily persists the data even is 'selectedCommand' is set to null and modal starts fading out (to prevent the modal from flashing the 'undefined' values)
    const [command, setCommand] = useState(selectedCommand);
    useEffect(() => { if(selectedCommand) setCommand(selectedCommand); }, [selectedCommand]);

    return(
        <Modal
            isOpen={selectedCommand !== null}
            closeModal={() => setSelectedCommandId(null)}
        >
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

                        {/* Type */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>Type</div>
                            <div className={styles.fieldValue}>{command?.CMD_TYPE}</div>
                        </div>

                        {/* Source */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>Source</div>
                            <div className={styles.fieldValue}>{command?.CMD_SRC}</div>
                        </div>

                        {/* Target */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>Target</div>
                            <div className={styles.fieldValue}>{command?.CMD_TGT}</div>
                        </div>

                        {/* Where */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>Where</div>
                            <div className={styles.fieldValue}>{command?.CMD_WHERE}</div>
                        </div>

                        {/* Binds */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>Binds</div>
                            <div className={styles.fieldValue}>{command?.CMD_BINDS}</div>
                        </div>

                        {/* Refresh type */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>Refresh type</div>
                            <div className={styles.fieldValue}>{command?.REFRESH_TYPE}</div>
                        </div>

                        {/* Business key */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>Business key</div>
                            <div className={styles.fieldValue}>{command?.BUSINESS_KEY}</div>
                        </div>

                        {/* Merge on fields */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>Merge on fields</div>
                            <div className={styles.fieldValue}>{command?.MERGE_ON_FIELDS}</div>
                        </div>

                        {/* Generate merge matched clause */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>Generate merge matched clause</div>
                            <div className={styles.fieldValue}>{command?.GENERATE_MERGE_MATCHED_CLAUSE}</div>
                        </div>

                        {/* Generate merge non matched clause */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>Generate merge non matched clause</div>
                            <div className={styles.fieldValue}>{command?.GENERATE_MERGE_NON_MATCHED_CLAUSE}</div>
                        </div>

                        {/* Additional fields */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>Additional fields</div>
                            <div className={styles.fieldValue}>{command?.ADDITIONAL_FIELDS}</div>
                        </div>

                        {/* Temp table */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>Temp table</div>
                            <div className={styles.fieldValue}>{command?.TEMP_TABLE}</div>
                        </div>

                        {/* Pivot by */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>Pivot by</div>
                            <div className={styles.fieldValue}>{command?.CMD_PIVOT_BY}</div>
                        </div>

                        {/* Pivot field */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>Pivot field</div>
                            <div className={styles.fieldValue}>{command?.CMD_PIVOT_FIELD}</div>
                        </div>

                        {/* DQ type */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>DQ type</div>
                            <div className={styles.fieldValue}>{command?.DQ_TYPE}</div>
                        </div>

                        {/* External call */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>External call</div>
                            <div className={styles.fieldValue}>{command?.CMD_EXTERNAL_CALL}</div>
                        </div>

                        {/* Active */}
                        <div className={styles.fieldPair}>
                            <div className={styles.fieldLabel}>Active</div>
                            <div className={styles.fieldValue}>{command?.ACTIVE}</div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}