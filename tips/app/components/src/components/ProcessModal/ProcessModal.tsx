// React
import { useState, useEffect, useRef } from 'react';

// Framer motion
import { AnimatePresence, motion } from 'framer-motion';

// Contexts
import { useProcessModalData } from '@/contexts/ProcessModalDataContex';

// Components
import Modal from '@/components/reusable/Modal';
import FloatingEditButtons from '@/components/reusable/FloatingEditButtons';

// Interfaces
import { ProcessDataInterface, ExecutionStatusInterface } from '@/interfaces/Interfaces';

// Enums
import { ExecutionStatus, OperationType } from '@/enums/enums';

// CSS
import styles from '@/styles/ProcessModal/ProcessModal.module.css';

// Icons
import { CircleCheck, AlertCircle, SpacingVertical } from 'tabler-icons-react';

type InputRefs = {
    [K in keyof ProcessDataInterface]: {
        ref?: HTMLInputElement | null;
        isActive?: boolean;
        caretPosition?: number | null;
    };
}

export default function ProcessModal() {
    const { executionStatus, process, setProcess } = useProcessModalData();
    const [showExecutionStatusMessage, setShowExecutionStatusMessage] = useState<ExecutionStatusInterface>({ status: ExecutionStatus.NONE });
    const [editedProcessValues, setEditedProcessValues] = useState<ProcessDataInterface | null>(process?.process ?? null);
    const [isEditing, setIsEditing] = useState(process?.operation.type === OperationType.CREATE);
    const [isRunFlow, setIsRunFlow] = useState(process?.operation.type === OperationType.RUN);
    const [isDownloading, setIsDownloading] = useState(process?.operation.type === OperationType.DOWNLOAD);
    const inputRefs = useRef({} as InputRefs);

    useEffect(() => { // When Python sends notification about execution of SQL instruction, show message to user for 3 seconds
        if (executionStatus.status === ExecutionStatus.SUCCESS || executionStatus.status === ExecutionStatus.FAIL) {
            setIsEditing(false);
            setShowExecutionStatusMessage(executionStatus);
            setTimeout(() => {
                setShowExecutionStatusMessage({ status: ExecutionStatus.NONE });
                if ((executionStatus.operationType === OperationType.DELETE || executionStatus.operationType === OperationType.RUN || executionStatus.operationType === OperationType.DOWNLOAD) && executionStatus.status === ExecutionStatus.SUCCESS) handleCloseModal();
            }, 5000);
        }
    }, [executionStatus]);

    useEffect(() => { // Set caret position within input field which has been modified back to where it shouold be (because cleansing the value and replacing text would by default push the cursor the the end of the input field)
        const activeField = Object.entries(inputRefs.current).find(([_processProperty, _processValue]) => {
            const processProperty = _processProperty as keyof ProcessDataInterface;
            const processValue = _processValue as InputRefs[keyof ProcessDataInterface];
            return processValue.isActive;
        });
        if (activeField) {
            const [_processProperty, processValue] = activeField;
            const input = processValue.ref;
            if (input) {
                input.focus();
                input.setSelectionRange(processValue.caretPosition!, processValue.caretPosition!);
            }
        }
    }, [editedProcessValues]);

    function getEditedProperties(modifiedValues: ProcessDataInterface, originalValues: ProcessDataInterface) {
        const editedProperties: {
            [propertyName in keyof ProcessDataInterface]?: ProcessDataInterface[propertyName]
        } = Object.entries(modifiedValues).reduce((accumulator, [_processProperty, _processValue]) => {
            const processProperty = _processProperty as keyof ProcessDataInterface;
            const processValue = _processValue as ProcessDataInterface[keyof ProcessDataInterface];
            const propertyHasChanged = processValue !== originalValues[processProperty];

            if (propertyHasChanged) return { ...accumulator, [processProperty]: processValue };
            return accumulator;
        }, {});

        return editedProperties;
    }

    function handleCancel() {
        setEditedProcessValues(process!.process);
        setIsEditing(false);
        setIsRunFlow(false);
        setIsDownloading(false);
        if (process!.operation.type === OperationType.CREATE) handleCloseModal();
    }

    function handleSave() {
        if (process!.operation.type == OperationType.EDIT) {
            const editedProperties = getEditedProperties(editedProcessValues!, process!.process);
            if (Object.keys(editedProperties).length === 0) { // No changes have been made to process
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

    function handleDelete() {
        setProcess((prevState) => ({
            ...prevState!,
            operation: {
                type: OperationType.DELETE
            },
            executionStatus: ExecutionStatus.RUNNING
        }));
    }

    function handleRun() {
        const editedProperties = getEditedProperties(editedProcessValues!, process!.process);

        setProcess((prevState) => ({
            ...prevState!,
            process: editedProcessValues!,
            executionStatus: ExecutionStatus.RUNNING
        }));

    }

    function handleDownload() {
        setProcess((prevState) => ({
            ...prevState!,
            operation: {
                type: OperationType.DOWNLOAD
            },
            executionStatus: ExecutionStatus.RUNNING
        }));

    }

    function handleCloseModal() {
        setProcess(null);
    }

    function captureRef(ref: HTMLInputElement | null, propertyName: keyof ProcessDataInterface) { // Assign the input element's ref to the inputRefs state variable for the specified property
        inputRefs.current[propertyName] = {
            ...inputRefs.current[propertyName],
            ref
        };
    }

    function handleInputChange(modifiedProperty: keyof ProcessDataInterface, event: React.ChangeEvent<HTMLInputElement>) {

        // Set isActive attribute within inputRefs state variable to true since input is focused
        inputRefs.current[modifiedProperty] = {
            ...inputRefs.current[modifiedProperty],
            isActive: true
        };

        // Update caret position within inputRefs state variable
        inputRefs.current[modifiedProperty] = {
            ...inputRefs.current[modifiedProperty],
            caretPosition: event.target.selectionStart!
        };

        // Update field value
        const modifiedValue = event.target.value;
        const sanitisedValue = modifiedProperty === 'PROCESS_NAME' ? sanitiseNameForDB(modifiedValue) : modifiedValue;
        setEditedProcessValues((prevState) => ({ ...prevState!, [modifiedProperty]: sanitisedValue }));

        function sanitiseNameForDB(name: string) { // Turn all letters into all caps, will replace all spaces with underscores, and will remove all other characters except for numbers and dashes
            return name.toUpperCase().replace(/ /g, '_').replace(/[^A-Z0-9_\-]/g, '');
        }
    }

    function handleBlur(propertyName: keyof ProcessDataInterface) { // Update isActive attribute within inputRefs state variable to false when an input loses focus
        inputRefs.current[propertyName] = {
            ...inputRefs.current[propertyName],
            isActive: false
        };
    }

    function toggleProcessStatus() {
        setEditedProcessValues((prevState) => ({
            ...prevState!,
            ACTIVE: prevState!.ACTIVE === 'Y' ? 'N' : 'Y'
        }));
    }

    function toggleProcessExecuteFlag() {
        setEditedProcessValues((prevState) => ({
            ...prevState!,
            EXECUTE_FLAG: prevState!.EXECUTE_FLAG === 'Y' ? 'N' : 'Y'
        }));
    }

    const processing = Boolean(process?.executionStatus === ExecutionStatus.RUNNING);

    const executionStatusMessage: { [key in OperationType]: { [status in ExecutionStatus.SUCCESS | ExecutionStatus.FAIL]: string } } = {
        [OperationType.CREATE]: {
            [ExecutionStatus.SUCCESS]: 'Process created successfully',
            [ExecutionStatus.FAIL]: 'Failed to create process'
        },
        [OperationType.EDIT]: {
            [ExecutionStatus.SUCCESS]: 'Process updated successfully',
            [ExecutionStatus.FAIL]: 'Failed to update process'
        },
        [OperationType.DELETE]: {
            [ExecutionStatus.SUCCESS]: 'Process deleted successfully',
            [ExecutionStatus.FAIL]: 'Failed to delete process'
        },
        [OperationType.RUN]: {
            [ExecutionStatus.SUCCESS]: 'Process execution competed. Please check into logs for any warnings!', //TBC add appropriate message to suggest checking logs page
            [ExecutionStatus.FAIL]: 'Process execution failed. Please check logs for details!'
        },
        [OperationType.DOWNLOAD]: {
            [ExecutionStatus.SUCCESS]: 'DML script downloaded successfully',
            [ExecutionStatus.FAIL]: 'Failed to download DML script'
        }
    };

    return (
        <Modal
            isOpen={Boolean(process)}
            onFadeOutComplete={handleCloseModal}
            noPadding
        >
            <div className={styles.container}>
                {!isDownloading &&
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
                                    ref={(ref) => captureRef(ref, 'PROCESS_NAME')}
                                    value={editedProcessValues?.PROCESS_NAME ?? ''}
                                    onChange={(e) => handleInputChange('PROCESS_NAME', e)}
                                    onBlur={() => handleBlur('PROCESS_NAME')}
                                    placeholder='Enter a process name'
                                    disabled={!isEditing || processing}
                                    data-editing={isEditing}
                                />
                            </div>
                        </div>
                        {!isRunFlow && !isDownloading &&
                            <>
                                <div className={styles.separator} />
                                <div className={styles.headerRight} data-active-status={(isEditing ? editedProcessValues : process?.process)?.ACTIVE == 'Y'}>

                                    {/* Status label */}
                                    <motion.div layout>
                                        {(isEditing ? editedProcessValues : process?.process)?.ACTIVE == 'Y' ? 'Active' : 'Inactive'}
                                    </motion.div>

                                    {/* Toggle status button */}
                                    <AnimatePresence mode='popLayout'>
                                        {isEditing && (
                                            <motion.button
                                                onClick={toggleProcessStatus}
                                                disabled={processing}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                            >
                                                {(isEditing ? editedProcessValues : process?.process)?.ACTIVE == 'Y' ? 'Disable' : 'Enable'}
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        }
                    </div>
                }
                <div className={styles.configContainer}>
                    {isDownloading ?
                        <div className={styles.descriptionContainer}>
                            <center>DML Script will be downloaded to metadata folder</center>
                            <br></br>
                            <center>Any existing script with same process name would be overwritten</center>
                            <br></br>
                            <h4><center>Proceed with Download?</center></h4>
                            <br></br>
                        </div>
                        :
                        <div className={styles.configContainer}>
                            {isRunFlow ?
                                <div className={styles.descriptionContainer}>
                                    <h2>Bind Variables</h2>
                                    <div>
                                        {/* Focus indicator bar */}
                                        <div className={styles.focusIndicatorBar} data-editing={isRunFlow} />

                                        {/* Textarea */}
                                        <textarea
                                            value={editedProcessValues?.BIND_VARS ?? ''}
                                            onChange={(e) => setEditedProcessValues((prevState) => ({ ...prevState!, BIND_VARS: e.target.value }))}
                                            placeholder='Enter bind variables in JSON Format e.g. {"KEY":"VALUE"}'
                                            disabled={!isRunFlow || processing}
                                            data-editing={isRunFlow}
                                        />
                                    </div>

                                </div>
                                :
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

                            }
                        </div>
                    }
                </div>
                {!isDownloading && isRunFlow &&
                    <div className={styles.configContainer}>
                        <div className={styles.descriptionContainer}>
                            <h2>Run in Execute Mode?&nbsp;&nbsp;&nbsp;
                                <AnimatePresence mode='popLayout'>
                                    <motion.button
                                        onClick={toggleProcessExecuteFlag}
                                        disabled={processing}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {(isRunFlow ? editedProcessValues : process?.process)?.EXECUTE_FLAG == 'Y' ? 'Yes' : 'No'}
                                    </motion.button>
                                </AnimatePresence>
                            </h2>
                        </div>
                    </div>
                }

                {/* Execution status message */}
                <AnimatePresence>
                    {(showExecutionStatusMessage.status === ExecutionStatus.SUCCESS || showExecutionStatusMessage.status === ExecutionStatus.FAIL) && (
                        <motion.div
                            className={styles.executionStatusMessageContainer}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div>
                                {/* Icon */}
                                {showExecutionStatusMessage.status === ExecutionStatus.SUCCESS
                                    ? <CircleCheck size={40} color='var(--success-green-light)' />
                                    : <AlertCircle size={40} color='var(--fail-red-light)' />
                                }

                                {/* Text */}
                                {executionStatusMessage[showExecutionStatusMessage.operationType][showExecutionStatusMessage.status]}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <FloatingEditButtons
                type={process?.operation.type === OperationType.CREATE ? 'create' : process?.operation.type === OperationType.DOWNLOAD ? 'download' : process?.operation.type === OperationType.RUN ? 'run' : 'edit'}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                isRunFlow={isRunFlow}
                setIsRunFlow={setIsRunFlow}
                isDownloading={isDownloading}
                setIsDownloading={setIsDownloading}
                allowDelete={process?.operation.type === OperationType.EDIT}
                isSaving={processing}
                onCancel={handleCancel}
                onSave={handleSave}
                onDelete={handleDelete}
                onRun={handleRun}
                onDownload={handleDownload}
            />
        </Modal >
    );
}