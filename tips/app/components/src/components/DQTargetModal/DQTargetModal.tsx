// React
import { useState, useEffect, useRef } from 'react';

// Framer motion
import { AnimatePresence, motion } from 'framer-motion';

// Contexts
import { useDQTargetModalData } from '@/contexts/DQTargetModalDataContext';

// Components
import Modal from '@/components/reusable/Modal';
import FloatingEditButtons from '@/components/reusable/FloatingEditButtons';

// Interfaces
import { DQTargetDataInterface, ExecutionStatusInterface } from '@/interfaces/Interfaces';

// Enums
import { ExecutionStatus, OperationType } from '@/enums/enums';

// CSS
import styles from '@/styles/DQModal/DQModal.module.css';

// Icons
import { CircleCheck, AlertCircle } from 'tabler-icons-react';

type InputRefs = {
    [K in keyof DQTargetDataInterface]: {
        ref?: HTMLInputElement | null;
        isActive?: boolean;
        caretPosition?: number | null;
    };
}

export default function DQTargetModal() {
    const { executionStatus, dqtarget, setDQTarget } = useDQTargetModalData();
    const [showExecutionStatusMessage, setShowExecutionStatusMessage] = useState<ExecutionStatusInterface>({ status: ExecutionStatus.NONE });
    const [editedDQTargetValues, setEditedDQTargetValues] = useState<Partial<DQTargetDataInterface | null>>(dqtarget?.dqtarget ?? null);
    const [isEditing, setIsEditing] = useState(dqtarget?.operation.type === OperationType.CREATE);
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
        const activeField = Object.entries(inputRefs.current).find(([_dqtargetProperty, _dqtargetValue]) => {
            const dqtargetProperty = _dqtargetProperty as keyof DQTargetDataInterface;
            const dqtargetValue = _dqtargetValue as InputRefs[keyof DQTargetDataInterface];
            return dqtargetValue.isActive;
        });
        if (activeField) {
            const [_dqtargetProperty, dqtargetValue] = activeField;
            const input = dqtargetValue.ref;
            if (input) {
                input.focus();
                input.setSelectionRange(dqtargetValue.caretPosition!, dqtargetValue.caretPosition!);
            }
        }
    }, [editedDQTargetValues]);

    function getEditedProperties(modifiedValues: Partial<DQTargetDataInterface>, originalValues: Partial<DQTargetDataInterface>) {
        const editedProperties: {
            [propertyName in keyof DQTargetDataInterface]?: DQTargetDataInterface[propertyName]
        } = Object.entries(modifiedValues).reduce((accumulator, [_dqtargetProperty, _dqtargetValue]) => {
            const dqtargetProperty = _dqtargetProperty as keyof DQTargetDataInterface;
            const dqtargetValue = _dqtargetValue as DQTargetDataInterface[keyof DQTargetDataInterface];
            const propertyHasChanged = dqtargetValue !== originalValues[dqtargetProperty];

            if (propertyHasChanged) return { ...accumulator, [dqtargetProperty]: dqtargetValue };
            return accumulator;
        }, {});

        return editedProperties;
    }

    function handleCancel() {
        setEditedDQTargetValues(dqtarget!.dqtarget);
        setIsEditing(false);
        if (dqtarget!.operation.type === OperationType.CREATE) handleCloseModal();
    }

    function handleSave() {
        if (dqtarget!.operation.type == OperationType.EDIT) {
            const editedProperties = getEditedProperties(editedDQTargetValues!, dqtarget!.dqtarget!);
            if (Object.keys(editedProperties).length === 0) { // No changes have been made to process
                setIsEditing(false);
                return;
            }
        }

        setDQTarget((prevState) => ({
            ...prevState!,
            dqtarget: editedDQTargetValues!,
            executionStatus: ExecutionStatus.RUNNING
        }));
    }

    function handleDelete() {
        setDQTarget((prevState) => ({
            ...prevState!,
            operation: {
                type: OperationType.DELETE
            },
            executionStatus: ExecutionStatus.RUNNING
        }));
    }

    function handleCloseModal() {
        setDQTarget(null);
    }

    function captureRef(ref: HTMLInputElement | null, propertyName: keyof DQTargetDataInterface) { // Assign the input element's ref to the inputRefs state variable for the specified property
        inputRefs.current[propertyName] = {
            ...inputRefs.current[propertyName],
            ref
        };
    }

    function handleInputChange(modifiedProperty: keyof DQTargetDataInterface, event: React.ChangeEvent<HTMLInputElement>) {

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
        const sanitisedValue = (modifiedProperty === 'TGT_NAME' || modifiedProperty === 'ATTRIBUTE_NAME') ? sanitiseNameForDB(modifiedValue) : modifiedValue;
        setEditedDQTargetValues((prevState) => ({ ...prevState!, [modifiedProperty]: sanitisedValue }));

        function sanitiseNameForDB(name: string) { // Turn all letters into all caps, will replace all spaces with underscores, and will remove all other characters except for numbers and dashes
            return name.toUpperCase().replace(/ /g, '_').replace(/[^A-Z0-9_\-]/g, '');
        }
    }

    function handleBlur(propertyName: keyof DQTargetDataInterface) { // Update isActive attribute within inputRefs state variable to false when an input loses focus
        inputRefs.current[propertyName] = {
            ...inputRefs.current[propertyName],
            isActive: false
        };
    }

    function toggleDQStatus() {
        setEditedDQTargetValues((prevState) => ({
            ...prevState!,
            ACTIVE: prevState!.ACTIVE === 'Y' ? 'N' : 'Y'
        }));
    }

    const processing = Boolean(dqtarget?.executionStatus === ExecutionStatus.RUNNING);

    const executionStatusMessage: { [key in OperationType]: { [status in ExecutionStatus.SUCCESS | ExecutionStatus.FAIL]: string } } = {
        [OperationType.CREATE]: {
            [ExecutionStatus.SUCCESS]: 'DQ Test Target created successfully',
            [ExecutionStatus.FAIL]: 'Failed to create DQ Test Target'
        },
        [OperationType.EDIT]: {
            [ExecutionStatus.SUCCESS]: 'DQ Test Target updated successfully',
            [ExecutionStatus.FAIL]: 'Failed to update DQ Test Target'
        },
        [OperationType.DELETE]: {
            [ExecutionStatus.SUCCESS]: 'DQ Test Target deleted successfully',
            [ExecutionStatus.FAIL]: 'Failed to delete DQ Test Target'
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
            isOpen={Boolean(dqtarget)}
            onFadeOutComplete={handleCloseModal}
            noPadding
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>

                        {/* Process name */}
                        <h1>DQ Test Name</h1>

                        {/* Process name (input) */}
                        <div className={styles.dqNameContainer}>

                            {/* Dummy text to make input element expand to fit text content */}
                            <div className={styles.invisibleExpander}>{editedDQTargetValues?.PROCESS_DQ_TEST_NAME}</div>

                            {/* Focus indicator bar */}
                            {/* <div className={styles.focusIndicatorBar} data-editing={isEditing} /> */}

                            {/* Input element */}
                            <input
                                ref={(ref) => captureRef(ref, 'PROCESS_DQ_TEST_NAME')}
                                value={editedDQTargetValues?.PROCESS_DQ_TEST_NAME ?? ''}
                                onChange={(e) => handleInputChange('PROCESS_DQ_TEST_NAME', e)}
                                onBlur={() => handleBlur('PROCESS_DQ_TEST_NAME')}
                                placeholder='Enter DQ Test Name'
                                disabled={true}    //{!isEditing || processing}
                                data-editing={false}  //{isEditing}
                            />
                        </div>
                    </div>
                    <div className={styles.separator} />
                    <div className={styles.headerRight} data-active-status={(isEditing ? editedDQTargetValues : dqtarget?.dqtarget)?.ACTIVE == 'Y'}>

                        {/* Status label */}
                        <motion.div layout>
                            {(isEditing ? editedDQTargetValues : dqtarget?.dqtarget)?.ACTIVE == 'Y' ? 'Active' : 'Inactive'}
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
                                    {(isEditing ? editedDQTargetValues : dqtarget?.dqtarget)?.ACTIVE == 'Y' ? 'Disable' : 'Enable'}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <div className={styles.configContainer}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            {/* Field title */}
                            <h2>DQ Test Target</h2>
                            <div className={styles.dqNameContainer}>

                                {/* Dummy text to make input element expand to fit text content */}
                                <div className={styles.invisibleExpander}>{editedDQTargetValues?.TGT_NAME}</div>

                                {/* Focus indicator bar */}
                                <div className={styles.focusIndicatorBar} data-editing={isEditing} />

                                {/* Input element */}
                                <input
                                    ref={(ref) => captureRef(ref, 'TGT_NAME')}
                                    value={editedDQTargetValues?.TGT_NAME ?? ''}
                                    onChange={(e) => handleInputChange('TGT_NAME', e)}
                                    onBlur={() => handleBlur('TGT_NAME')}
                                    placeholder='Enter DQ Test Target Object Name'
                                    disabled={!isEditing || processing}
                                    data-editing={isEditing}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.configContainer}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            {/* Field title */}
                            <h2>DQ Test Target Attribute</h2>
                            <div className={styles.dqNameContainer}>

                                {/* Dummy text to make input element expand to fit text content */}
                                <div className={styles.invisibleExpander}>{editedDQTargetValues?.ATTRIBUTE_NAME}</div>

                                {/* Focus indicator bar */}
                                <div className={styles.focusIndicatorBar} data-editing={isEditing} />

                                {/* Input element */}
                                <input
                                    ref={(ref) => captureRef(ref, 'ATTRIBUTE_NAME')}
                                    value={editedDQTargetValues?.ATTRIBUTE_NAME ?? ''}
                                    onChange={(e) => handleInputChange('ATTRIBUTE_NAME', e)}
                                    onBlur={() => handleBlur('ATTRIBUTE_NAME')}
                                    placeholder='Enter DQ Test Target Attribute/Column Name'
                                    disabled={!isEditing || processing}
                                    data-editing={isEditing}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                {(isEditing ? editedDQTargetValues : dqtarget?.dqtarget)?.PROCESS_DQ_TEST_NAME === 'ACCEPTED_VALUES' &&
                    <div className={styles.configContainer}>
                        <div className={styles.descriptionContainer}>
                            {/* Field title */}
                            <h2>DQ Test Accepted Values</h2>
                            <div>
                                {/* Focus indicator bar */}
                                <div className={styles.focusIndicatorBar} data-editing={isEditing} />

                                {/* Textarea */}
                                <textarea
                                    value={editedDQTargetValues?.ACCEPTED_VALUES ?? ''}
                                    onBlur={() => handleBlur('ACCEPTED_VALUES')}
                                    onChange={(e) => setEditedDQTargetValues((prevState) => ({ ...prevState!, ACCEPTED_VALUES: e.target.value }))}
                                    placeholder='Enter DQ Test Accepted Values'
                                    disabled={!isEditing || processing}
                                    data-editing={isEditing}
                                />
                            </div>
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
                type={dqtarget?.operation.type === OperationType.CREATE ? 'create' : 'edit'}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                isRunFlow={false}
                isDownloading={false}
                allowDelete={dqtarget?.operation.type === OperationType.EDIT}
                isSaving={processing}
                onCancel={handleCancel}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </Modal >
    );
}