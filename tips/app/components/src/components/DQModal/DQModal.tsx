// React
import { useState, useEffect, useRef } from 'react';

// Framer motion
import { AnimatePresence, motion } from 'framer-motion';

// Contexts
import { useDQModalData } from '@/contexts/DQModalDataContext';

// Components
import Modal from '@/components/reusable/Modal';
import FloatingEditButtons from '@/components/reusable/FloatingEditButtons';

// Interfaces
import { DQDataInterface, ExecutionStatusInterface } from '@/interfaces/Interfaces';

// Enums
import { ExecutionStatus, OperationType } from '@/enums/enums';

// CSS
import styles from '@/styles/DQModal/DQModal.module.css';

// Icons
import { CircleCheck, AlertCircle } from 'tabler-icons-react';

type InputRefs = {
    [K in keyof DQDataInterface]: {
        ref?: HTMLInputElement | null;
        isActive?: boolean;
        caretPosition?: number | null;
    };
}

export default function DQModal() {
    const inBuiltDQTests = ['UNIQUE','NOT_NULL','ACCEPTED_VALUES'];
    const { executionStatus, dqdata, setDQData } = useDQModalData();
    const [showExecutionStatusMessage, setShowExecutionStatusMessage] = useState<ExecutionStatusInterface>({ status: ExecutionStatus.NONE });
    const [editedDQValues, setEditedDQValues] = useState<DQDataInterface | null>(dqdata?.dqdata ?? null);
    const [isEditing, setIsEditing] = useState(dqdata?.operation.type === OperationType.CREATE);
    const inputRefs = useRef({} as InputRefs);

    useEffect(() => { // When Python sends notification about execution of SQL instruction, show message to user for 3 seconds
        if (executionStatus.status === ExecutionStatus.SUCCESS || executionStatus.status === ExecutionStatus.FAIL) {
            setIsEditing(false);
            setShowExecutionStatusMessage(executionStatus);
            setTimeout(() => {
                setShowExecutionStatusMessage({ status: ExecutionStatus.NONE });
                if (executionStatus.operationType === OperationType.DELETE && executionStatus.status === ExecutionStatus.SUCCESS) handleCloseModal();
            }, 3000);
        }
    }, [executionStatus]);

    useEffect(() => { // Set caret position within input field which has been modified back to where it shouold be (because cleansing the value and replacing text would by default push the cursor the the end of the input field)
        const activeField = Object.entries(inputRefs.current).find(([_dqProperty, _dqValue]) => {
            const dqProperty = _dqProperty as keyof DQDataInterface;
            const dqValue = _dqValue as InputRefs[keyof DQDataInterface];
            return dqValue.isActive;
        });
        if (activeField) {
            const [_dqProperty, dqValue] = activeField;
            const input = dqValue.ref;
            if (input) {
                input.focus();
                input.setSelectionRange(dqValue.caretPosition!, dqValue.caretPosition!);
            }
        }
    }, [editedDQValues]);

    function getEditedProperties(modifiedValues: DQDataInterface, originalValues: DQDataInterface) {
        const editedProperties: {
            [propertyName in keyof DQDataInterface]?: DQDataInterface[propertyName]
        } = Object.entries(modifiedValues).reduce((accumulator, [_dqProperty, _dqValue]) => {
            const dqProperty = _dqProperty as keyof DQDataInterface;
            const dqValue = _dqValue as DQDataInterface[keyof DQDataInterface];
            const propertyHasChanged = dqValue !== originalValues[dqProperty];

            if (propertyHasChanged) return { ...accumulator, [dqProperty]: dqValue };
            return accumulator;
        }, {});

        return editedProperties;
    }

    function handleCancel() {
        setEditedDQValues(dqdata!.dqdata);
        setIsEditing(false);
        if (dqdata!.operation.type === OperationType.CREATE) handleCloseModal();
    }

    function handleSave() {
        if (dqdata!.operation.type == OperationType.EDIT) {
            const editedProperties = getEditedProperties(editedDQValues!, dqdata!.dqdata);
            if (Object.keys(editedProperties).length === 0) { // No changes have been made to process
                setIsEditing(false);
                return;
            }
        }

        setDQData((prevState) => ({
            ...prevState!,
            dqdata: editedDQValues!,
            executionStatus: ExecutionStatus.RUNNING
        }));
    }

    function handleDelete() {
        setDQData((prevState) => ({
            ...prevState!,
            operation: {
                type: OperationType.DELETE
            },
            executionStatus: ExecutionStatus.RUNNING
        }));
    }

    function handleCloseModal() {
        setDQData(null);
    }

    function captureRef(ref: HTMLInputElement | null, propertyName: keyof DQDataInterface) { // Assign the input element's ref to the inputRefs state variable for the specified property
        inputRefs.current[propertyName] = {
            ...inputRefs.current[propertyName],
            ref
        };
    }

    function handleInputChange(modifiedProperty: keyof DQDataInterface, event: React.ChangeEvent<HTMLInputElement>) {

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
        const sanitisedValue = modifiedProperty === 'PROCESS_DQ_TEST_NAME' ? sanitiseNameForDB(modifiedValue) : modifiedValue;
        setEditedDQValues((prevState) => ({ ...prevState!, [modifiedProperty]: sanitisedValue }));

        function sanitiseNameForDB(name: string) { // Turn all letters into all caps, will replace all spaces with underscores, and will remove all other characters except for numbers and dashes
            return name.toUpperCase().replace(/ /g, '_').replace(/[^A-Z0-9_\-]/g, '');
        }
    }

    function handleBlur(propertyName: keyof DQDataInterface) { // Update isActive attribute within inputRefs state variable to false when an input loses focus
        inputRefs.current[propertyName] = {
            ...inputRefs.current[propertyName],
            isActive: false
        };
    }

    function toggleDQStatus() {
        setEditedDQValues((prevState) => ({
            ...prevState!,
            ACTIVE: prevState!.ACTIVE === 'Y' ? 'N' : 'Y'
        }));
    }

    const processing = Boolean(dqdata?.executionStatus === ExecutionStatus.RUNNING);

    const executionStatusMessage: { [key in OperationType]: { [status in ExecutionStatus.SUCCESS | ExecutionStatus.FAIL]: string } } = {
        [OperationType.CREATE]: {
            [ExecutionStatus.SUCCESS]: 'DQ Test created successfully',
            [ExecutionStatus.FAIL]: 'Failed to create DQ Test'
        },
        [OperationType.EDIT]: {
            [ExecutionStatus.SUCCESS]: 'DQ Test updated successfully',
            [ExecutionStatus.FAIL]: 'Failed to update DQ Test'
        },
        [OperationType.DELETE]: {
            [ExecutionStatus.SUCCESS]: 'DQ Test deleted successfully',
            [ExecutionStatus.FAIL]: 'Failed to delete DQ Test'
        },
        [OperationType.RUN]: {
            [ExecutionStatus.SUCCESS]: 'Not Applicable', //TBC add appropriate message to suggest checking logs page
            [ExecutionStatus.FAIL]: 'Not Applicable'
        },
        [OperationType.DOWNLOAD]: {
            [ExecutionStatus.SUCCESS]: 'Not Applicable',
            [ExecutionStatus.FAIL]: 'Not Applicable'
        }
    };

    return (
        <Modal
            isOpen={Boolean(dqdata)}
            onFadeOutComplete={handleCloseModal}
            noPadding
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>

                        {/* Process name */}
                        <h2>DQ Test</h2>

                        {/* Process name (input) */}
                        <div className={styles.dqNameContainer}>

                            {/* Dummy text to make input element expand to fit text content */}
                            <div className={styles.invisibleExpander}>{editedDQValues?.PROCESS_DQ_TEST_NAME}</div>

                            {/* Focus indicator bar */}
                            <div className={styles.focusIndicatorBar} data-editing={!inBuiltDQTests.includes(editedDQValues?.PROCESS_DQ_TEST_NAME ?? '') && isEditing} />

                            {/* Input element */}
                            <input
                                ref={(ref) => captureRef(ref, 'PROCESS_DQ_TEST_NAME')}
                                value={editedDQValues?.PROCESS_DQ_TEST_NAME ?? ''}
                                onChange={(e) => handleInputChange('PROCESS_DQ_TEST_NAME', e)}
                                onBlur={() => handleBlur('PROCESS_DQ_TEST_NAME')}
                                placeholder='Enter DQ Test Name'
                                disabled={inBuiltDQTests.includes(editedDQValues?.PROCESS_DQ_TEST_NAME ?? '') || !isEditing || processing}
                                data-editing={isEditing}
                            />
                        </div>
                    </div>
                    <div className={styles.separator} />
                    <div className={styles.headerRight} data-active-status={(isEditing ? editedDQValues : dqdata?.dqdata)?.ACTIVE == 'Y'}>

                        {/* Status label */}
                        <motion.div layout>
                            {(isEditing ? editedDQValues : dqdata?.dqdata)?.ACTIVE == 'Y' ? 'Active' : 'Inactive'}
                        </motion.div>

                        {/* Toggle status button */}
                        <AnimatePresence mode='popLayout'>
                            {isEditing && (
                                <motion.button
                                    onClick={toggleDQStatus}
                                    disabled={processing}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {(isEditing ? editedDQValues : dqdata?.dqdata)?.ACTIVE == 'Y' ? 'Disable' : 'Enable'}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <div className={styles.configContainer}>
                    <div className={styles.descriptionContainer}>
                        {/* Field title */}
                        <h2>DQ Test Description</h2>
                        <div>
                            {/* Focus indicator bar */}
                            <div className={styles.focusIndicatorBar} data-editing={isEditing} />

                            {/* Textarea */}
                            <textarea
                                value={editedDQValues?.PROCESS_DQ_TEST_DESCRIPTION ?? ''}
                                onBlur={() => handleBlur('PROCESS_DQ_TEST_DESCRIPTION')}
                                onChange={(e) => setEditedDQValues((prevState) => ({ ...prevState!, PROCESS_DQ_TEST_DESCRIPTION: e.target.value }))}
                                placeholder='Enter DQ Test description'
                                disabled={!isEditing || processing}
                                data-editing={isEditing}
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.configContainer}>
                    <div className={styles.descriptionContainer}>
                        {/* Field title */}
                        <h2>DQ Test Query Template</h2>
                        <div>
                            {/* Focus indicator bar */}
                            <div className={styles.focusIndicatorBar} data-editing={isEditing} />

                            {/* Textarea */}
                            <textarea
                                value={editedDQValues?.PROCESS_DQ_TEST_QUERY_TEMPLATE ?? ''}
                                onBlur={() => handleBlur('PROCESS_DQ_TEST_QUERY_TEMPLATE')}
                                onChange={(e) => setEditedDQValues((prevState) => ({ ...prevState!, PROCESS_DQ_TEST_QUERY_TEMPLATE: e.target.value }))}
                                placeholder='Enter DQ Test Query Template'
                                disabled={!isEditing || processing}
                                data-editing={isEditing}
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.configContainer}>
                    <div className={styles.descriptionContainer}>
                        {/* Field title */}
                        <h2>Error Message Template</h2>
                        <div>
                            {/* Focus indicator bar */}
                            <div className={styles.focusIndicatorBar} data-editing={isEditing} />

                            {/* Textarea */}
                            <textarea
                                value={editedDQValues?.PROCESS_DQ_TEST_ERROR_MESSAGE ?? ''}
                                onBlur={() => handleBlur('PROCESS_DQ_TEST_ERROR_MESSAGE')}
                                onChange={(e) => setEditedDQValues((prevState) => ({ ...prevState!, PROCESS_DQ_TEST_ERROR_MESSAGE: e.target.value }))}
                                placeholder='Enter Error Message Template'
                                disabled={!isEditing || processing}
                                data-editing={isEditing}
                            />
                        </div>
                    </div>
                </div>
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
                type={dqdata?.operation.type === OperationType.CREATE ? 'create' : 'edit'}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                isRunFlow={false}
                isDownloading={false}
                allowDelete={dqdata?.operation.type === OperationType.EDIT}
                isSaving={processing}
                onCancel={handleCancel}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </Modal >
    );
}