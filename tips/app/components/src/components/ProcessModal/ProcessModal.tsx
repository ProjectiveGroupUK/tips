// React
import { useState, useEffect } from 'react';

// Framer motion
import { AnimatePresence, motion } from 'framer-motion';

// Contexts
import { useProcessModalData } from '@/components/reusable/contexts/ProcessModalDataContex';

// Components
import Modal from '@/components/reusable/Modal';
import FloatingEditButtons from '@/components/EditCommandModal/FloatingEditButtons';

// Interfaces
import { ProcessDataInterface, ExecutionStatusInterface } from '@/interfaces/Interfaces';

// Enums
import { ExecutionStatus, OperationType } from '@/enums/enums';

// CSS
import styles from '@/styles/ProcessModal/ProcessModal.module.css';

// Icons
import { CircleCheck, AlertCircle } from 'tabler-icons-react';

export default function ProcessModal() {
    const { executionStatus, process, setProcess } = useProcessModalData();
    const [showExecutionStatusMessage, setShowExecutionStatusMessage] = useState<ExecutionStatusInterface>({ status: ExecutionStatus.NONE });
    const [editedProcessValues, setEditedProcessValues] = useState<ProcessDataInterface | null>(process?.process ?? null);
    const [isEditing, setIsEditing] = useState(true);

    useEffect(() => { // When Python sends notification about execution of SQL instruction, show message to user for 3 seconds
        if([ExecutionStatus.SUCCESS, ExecutionStatus.FAIL].includes(executionStatus.status)) {
            setIsEditing(false);
            setShowExecutionStatusMessage(executionStatus);
            setTimeout(() => {
                setShowExecutionStatusMessage({ status: ExecutionStatus.NONE });
            }, 3000);
        }
    }, [executionStatus]);

    function getEditedProperties(modifiedValues: ProcessDataInterface, originalValues: ProcessDataInterface) {
        const editedProperties: {
            [propertyName in keyof ProcessDataInterface]?: ProcessDataInterface[propertyName]
        } = Object.entries(modifiedValues).reduce((accumulator, [_processProperty, _processValue]) => {
            const processProperty = _processProperty as keyof ProcessDataInterface;
            const processValue = _processValue as ProcessDataInterface[keyof ProcessDataInterface];
            const propertyHasChanged = processValue !== originalValues[processProperty];

            if(propertyHasChanged) return { ...accumulator, [processProperty]: processValue };
            return accumulator;
        }, {});

        return editedProperties;
    }

    function handleCancel() {
        setEditedProcessValues(process!.process);
        setIsEditing(false);
    }

    function handleSave() {
        if(process!.operation.type == OperationType.EDIT) {
            const editedProperties = getEditedProperties(editedProcessValues!, process!.process);
            if(Object.keys(editedProperties).length === 0) { // No changes have been made to command
                setIsEditing(false);
                return;
            }
        }

        setProcess((prevState) => ({
            ...prevState!,
            process: editedProcessValues!,
            executionStatus: ExecutionStatus.RUNNING
        }));
    }

    function handleCloseModal() {
        setProcess(null);
    }

    const processing = Boolean(process?.executionStatus === ExecutionStatus.RUNNING);

    return (
        <Modal
            isOpen={Boolean(process)}
            onFadeOutComplete={handleCloseModal}
            noPadding
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>

                        {/* Process name */}
                        <h1>Process</h1>
                        
                        {/* Process name (input) */}
                        <div className={styles.processNameContainer}>

                            {/* Dummy text to make input element expand to fit text content */}
                            <div className={styles.invisibleExpander}>{editedProcessValues?.PROCESS_NAME}</div>

                            {/* Focus indicator bar */}
                            <div className={styles.focusIndicatorBar} data-editing={isEditing} />

                            {/* Input element */}
                            <input
                                value={editedProcessValues?.PROCESS_NAME ?? ''}
                                onChange={(e) => setEditedProcessValues((prevState) => ({ ...prevState!, PROCESS_NAME: e.target.value }))}
                                placeholder='Enter a process name'
                                disabled={!isEditing || processing}
                                data-editing={isEditing}
                            />
                        </div>
                    </div>
                    <div className={styles.separator} />
                    <div className={styles.headerRight} data-active-status={process?.process.ACTIVE == 'Y'}>
                        {process?.process.ACTIVE ? 'Active' : 'Inactive'}
                    </div>
                </div>
                <div className={styles.configContainer}>

                    {/* Description */}
                    <div className={styles.descriptionContainer}>

                        {/* Field title */}
                        <h2>Description</h2>

                        <div>
                            {/* Focus indicator bar */}
                            <div className={styles.focusIndicatorBar} data-editing={isEditing} />

                            {/* Textarea */}
                            <textarea 
                                value={editedProcessValues?.PROCESS_DESCRIPTION ?? ''}
                                onChange={(e) => setEditedProcessValues((prevState) => ({ ...prevState!, PROCESS_DESCRIPTION: e.target.value }))}
                                placeholder='Enter a process description'
                                disabled={!isEditing || processing}
                                data-editing={isEditing}
                            />
                        </div>
                    </div>
                </div>

                {/* Execution status message */}
                <AnimatePresence>
                { [ExecutionStatus.SUCCESS, ExecutionStatus.FAIL].includes(showExecutionStatusMessage.status) && (
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
                            { 
                                showExecutionStatusMessage.status === ExecutionStatus.SUCCESS ? <div>Command { showExecutionStatusMessage.operationType === OperationType.CREATE ? 'created' : 'updated' } <span className={styles.executionSuccess}>sucessfully</span></div>
                                : showExecutionStatusMessage.status === ExecutionStatus.FAIL ? <div><span className={styles.executionFail}>Failed</span> to { showExecutionStatusMessage.operationType === OperationType.CREATE ? 'create' : 'update' } command</div>
                                : null
                            }
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>

            <FloatingEditButtons
                type={process?.operation.type === OperationType.CREATE ? 'create' : 'edit'}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                isSaving={processing}
                onCancel={handleCancel}
                onSave={handleSave}
            />
        </Modal>
    );
 }