// React
import { useState, useEffect, useRef } from 'react';

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
    const [isEditing, setIsEditing] = useState(true);
    const inputRefs = useRef({} as InputRefs);

    useEffect(() => { // When Python sends notification about execution of SQL instruction, show message to user for 3 seconds
        if([ExecutionStatus.SUCCESS, ExecutionStatus.FAIL].includes(executionStatus.status)) {
            setIsEditing(false);
            setShowExecutionStatusMessage(executionStatus);
            setTimeout(() => {
                setShowExecutionStatusMessage({ status: ExecutionStatus.NONE });
            }, 3000);
        }
    }, [executionStatus]);

    useEffect(() => { // Set caret position within input field which has been modified back to where it shouold be (because cleansing the value and replacing text would by default push the cursor the the end of the input field)
        const activeField = Object.entries(inputRefs.current).find(([_processProperty, _processValue]) => {
            const processProperty = _processProperty as keyof ProcessDataInterface;
            const processValue = _processValue as InputRefs[keyof ProcessDataInterface];
            return processValue.isActive;
        });
        if(activeField) {
            const [_processProperty, processValue] = activeField;
            const input = processValue.ref;
            if(input) {
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
            if(Object.keys(editedProperties).length === 0) { // No changes have been made to process
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

        function sanitiseNameForDB (name: string) { // Turn all letters into all caps, will replace all spaces with underscores, and will remove all other characters except for numbers and dashes
            return name.toUpperCase().replace(/ /g, '_').replace(/[^A-Z0-9_\-]/g, '');
        }
    }

    function handleBlur(propertyName: keyof ProcessDataInterface) { // Update isActive attribute within inputRefs state variable to false when an input loses focus
        inputRefs.current[propertyName] = {
            ...inputRefs.current[propertyName],
            isActive: false
        };
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
                                showExecutionStatusMessage.status === ExecutionStatus.SUCCESS ? <div>Process { showExecutionStatusMessage.operationType === OperationType.CREATE ? 'created' : 'updated' } <span className={styles.executionSuccess}>sucessfully</span></div>
                                : showExecutionStatusMessage.status === ExecutionStatus.FAIL ? <div><span className={styles.executionFail}>Failed</span> to { showExecutionStatusMessage.operationType === OperationType.CREATE ? 'create' : 'update' } process</div>
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