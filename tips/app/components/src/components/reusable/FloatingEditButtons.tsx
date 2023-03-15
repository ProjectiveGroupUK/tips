// React
import { useEffect, useState } from "react";

// Framer motion
import { AnimatePresence, motion } from "framer-motion";

// React-spinners
import { PuffLoader } from "react-spinners";

// Tabler-icons
import { Trash } from "tabler-icons-react";

// CSS
import styles from "@/styles/FloatingEditButtons/FloatingEditButtons.module.css";

interface PropsInterface {
    type: 'create' | 'edit';
    isEditing: boolean;
    setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
    allowDelete?: boolean;
    isSaving?: boolean;
    onCancel?: () => void;
    onSave?: () => void;
    onDelete?: () => void;
}

export default function FloatingEditButton({ type, isEditing, setIsEditing, allowDelete, isSaving, onCancel, onSave, onDelete }: PropsInterface) {

    const [pendingConfirmDelete, setPendingConfirmDelete] = useState(false);

    useEffect(() => {
        if(!allowDelete || isEditing) setPendingConfirmDelete(false);
    }, [allowDelete, isEditing]);

    function handleCancel() {
        setPendingConfirmDelete(false);
        onCancel?.();
    }

    function handleSave() {
        onSave?.();
    }

    function handleDelete() {
        onDelete?.();
    }

    return(
        <div className={`${styles.editButtonContainer} ${isSaving && styles.savingInProgress} ${pendingConfirmDelete && styles.pendingDeleteConfirmation}`}>

            {/* Edit (or cancel) button */}
            <motion.button
                layout
                className={type === 'create' ? styles.button_discard : ((isEditing || pendingConfirmDelete) ? styles.button_cancel : styles.button_edit)}
                onClick={(isEditing || pendingConfirmDelete) ? handleCancel : () => setIsEditing(true)}
                disabled={isSaving}
            >
                { (isEditing || pendingConfirmDelete) ? 'Cancel' : 'Edit' }
            </motion.button>
            <AnimatePresence mode='popLayout'>

                {/* Save (or delete) button */}
                { (isEditing || isSaving || pendingConfirmDelete) && (
                    <motion.button
                        id="confirmActionButton"
                        className={pendingConfirmDelete ? styles.confirmDeleteButton : styles.confirmSaveButton}
                        onClick={pendingConfirmDelete ? handleDelete : handleSave}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                    >

                        {/* Label */}
                        <label htmlFor="confirmActionButton">{ type === 'create' ? 'Create' : (pendingConfirmDelete ? 'Confirm delete' : 'Save') }</label>

                        {/* Saving in progress spinner */}
                        { isSaving && <PuffLoader size={20} color='var(--primary)' /> }
                    </motion.button>
                )}

                {/* Delete button */}
                { allowDelete && (
                    <motion.button
                        key='deleteButton'
                        className={styles.button_delete}
                        onClick={() => setPendingConfirmDelete(true)}
                        disabled={pendingConfirmDelete || isEditing}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Trash size={18} strokeWidth={2} />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}